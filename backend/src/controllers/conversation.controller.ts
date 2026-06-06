import { Response } from "express";
import { VerifiedRequest } from "../types/req.types";
import { db } from "..";
import { conversationsTable, messagesTable } from "../db/schema";
import { and, desc, eq, lt, or } from "drizzle-orm";
import httpStatus from "http-status";
import { customerSupportChat } from "../ai";

export const getConversations = async (req: VerifiedRequest, res: Response) => {
  try {
    const userId = req.user["id"];
    const cursor = (req.query.cursor as string) || "";
    const PAGE_SIZE = 10;

    let timestamp: Date | null = null;
    let conversationId: string | null = null;

    if (cursor) {
      const separatorIndex = cursor.lastIndexOf("|");

      if (separatorIndex === -1) {
        res.status(httpStatus.BAD_REQUEST).send({
          error: "Invalid cursor format",
        });
        return;
      }

      const createdAtPart = cursor.slice(0, separatorIndex);
      const idPart = cursor.slice(separatorIndex + 1);
      const parsedTimestamp = new Date(createdAtPart);

      if (Number.isNaN(parsedTimestamp.getTime()) || !idPart) {
        res.status(httpStatus.BAD_REQUEST).send({
          error: "Invalid cursor value",
        });
        return;
      }

      timestamp = parsedTimestamp;
      conversationId = idPart;
    }

    const rows = await db
      .select({
        id: conversationsTable.id,
        title: conversationsTable.title,
        createdAt: conversationsTable.createdAt,
      })
      .from(conversationsTable)
      .where(
        timestamp && conversationId
          ? and(
              eq(conversationsTable.userId, userId),
              or(
                lt(conversationsTable.createdAt, timestamp),
                and(
                  eq(conversationsTable.createdAt, timestamp),
                  lt(conversationsTable.id, conversationId),
                ),
              ),
            )
          : eq(conversationsTable.userId, userId),
      )
      .orderBy(desc(conversationsTable.createdAt), desc(conversationsTable.id))
      .limit(PAGE_SIZE);

    if (rows.length === 0) {
      res.status(httpStatus.OK).send({
        conversations: [],
        nextCursor: null,
      });
      return;
    }

    const groupedByDate = new Map<
      string,
      { createdAt: string; records: { id: string; title: string }[] }
    >();

    for (const row of rows) {
      const createdAtValue = row.createdAt
        ? new Date(row.createdAt)
        : new Date();
      const dateKey = createdAtValue.toISOString().split("T")[0];

      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, {
          createdAt: dateKey,
          records: [],
        });
      }

      groupedByDate.get(dateKey)?.records.push({
        id: row.id,
        title: row.title,
      });
    }

    const lastRow = rows[rows.length - 1];
    const nextCursor = lastRow?.createdAt
      ? `${new Date(lastRow.createdAt).toISOString()}|${lastRow.id}`
      : null;

    res.status(httpStatus.OK).send({
      conversations: Array.from(groupedByDate.values()),
      nextCursor,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      error: "Cannot fetch conversations, please try again later",
    });
  }
};

export const getConversation = async (req: VerifiedRequest, res: Response) => {
  try {
    const userId = req.user["id"];
    const conversationId = req.params.conversationId as string;

    if (!conversationId) {
      res.status(httpStatus.NOT_FOUND).send({
        error: "Conversation ID is required",
      });
      return;
    }

    const conversation = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.id, conversationId),
          eq(conversationsTable.userId, userId),
        ),
      )
      .innerJoin(
        messagesTable,
        eq(conversationsTable.id, messagesTable.conversationId),
      );

    if (!conversation || conversation.length === 0) {
      res.status(httpStatus.NOT_FOUND).send({
        error: "Conversation not found",
      });
      return;
    }

    res.status(httpStatus.OK).send({
      conversation,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      error: "Cannot fetch conversation, please try again later",
    });
  }
};

export const chat = async (req: VerifiedRequest, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const userId = req.user["id"];
    const { message } = req.body;

    if (!message) {
      res.status(httpStatus.BAD_REQUEST).send({
        error: "Message is required",
      });
      return;
    }

    if (!conversationId) {
      const chatSupportResponse = await customerSupportChat(true, message);

      const conversation = await db
        .insert(conversationsTable)
        .values({
          userId,
          title: chatSupportResponse.suggested_title,
        })
        .returning();

      await db
        .insert(messagesTable)
        .values({
          conversationId: conversation[0].id,
          sender: "user",
          content: message,
        })
        .returning();

      await db
        .insert(messagesTable)
        .values({
          conversationId: conversation[0].id,
          sender: "ai",
          content: chatSupportResponse.output_text,
        })
        .returning();

      res.status(httpStatus.CREATED).send({
        conversationId: conversation[0].id,
      });
    } else {
      const chatSupportResponse = await customerSupportChat(false, message);

      await db
        .insert(messagesTable)
        .values({
          conversationId,
          sender: "user",
          content: message,
        })
        .returning();

      await db
        .insert(messagesTable)
        .values({
          conversationId,
          sender: "ai",
          content: chatSupportResponse.output_text,
        })
        .returning();

      res.status(httpStatus.CREATED).send({
        data: chatSupportResponse,
      });
    }
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      error: "Cannot send message, please try again later",
    });
  }
};

export const deleteConversation = async (
  req: VerifiedRequest,
  res: Response,
) => {
  try {
    const userId = req.user["id"];
    const conversationId = req.params.conversationId as string;

    if (!conversationId) {
      res.status(httpStatus.NOT_FOUND).send({
        error: "Conversation ID is required",
      });
      return;
    }

    const conversation = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.id, conversationId),
          eq(conversationsTable.userId, userId),
        ),
      );

    if (!conversation || conversation.length === 0) {
      res.status(httpStatus.NOT_FOUND).send({
        error: "Conversation not found",
      });
      return;
    }

    await db
      .delete(conversationsTable)
      .where(
        and(
          eq(conversationsTable.id, conversationId),
          eq(conversationsTable.userId, userId),
        ),
      );

    res.status(httpStatus.OK).send({
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      error: "Cannot delete conversation, please try again later",
    });
  }
};
