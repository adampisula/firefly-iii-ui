import { expect, test } from "@playwright/test";

const headersFor = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

test.describe("CORE-11 attachment contracts", () => {
  test("metadata, upload, download, update and delete", async ({ request }) => {
    const token = process.env.FIREFLY_TEST_PAT;
    if (!token) {
      test.skip();
      return;
    }
    const headers = headersFor(token);
    const suffix = Date.now().toString(36);
    const category = await request.post("/api/v1/categories", {
      headers,
      data: { name: `CORE-11 category ${suffix}` },
    });
    const categoryBody = (await category.json()) as { data?: { id: string } };
    expect(category.ok(), JSON.stringify(categoryBody)).toBeTruthy();
    const categoryId = categoryBody.data?.id;
    if (!categoryId) throw new Error("No category id");
    let attachmentId: string | undefined;

    try {
      const created = await request.post("/api/v1/attachments", {
        headers,
        data: {
          title: `CORE-11 file ${suffix}`,
          filename: "hello.txt",
          attachable_type: "Category",
          attachable_id: Number(categoryId),
          notes: "attachment note",
        },
      });
      const body = (await created.json()) as {
        data?: {
          id: string;
          attributes: { attachable_type: string; filename: string };
        };
      };
      expect(created.ok(), JSON.stringify(body)).toBeTruthy();
      attachmentId = body.data?.id;
      if (!attachmentId) throw new Error("No attachment id");
      expect(body.data?.attributes.attachable_type).toBe("Category");

      const upload = await request.post(
        `/api/v1/attachments/${attachmentId}/upload`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "text/plain",
          },
          data: "hello attachment",
        },
      );
      expect(upload.status()).toBe(204);

      const download = await request.get(
        `/api/v1/attachments/${attachmentId}/download`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "*/*" } },
      );
      expect(download.ok()).toBeTruthy();
      expect((await download.body()).toString()).toContain("hello attachment");

      const update = await request.put(`/api/v1/attachments/${attachmentId}`, {
        headers,
        data: {
          title: `CORE-11 file updated ${suffix}`,
          notes: "updated note",
        },
      });
      expect(update.ok()).toBeTruthy();
      const read = await request.get(`/api/v1/attachments/${attachmentId}`, {
        headers,
      });
      const readBody = (await read.json()) as {
        data: { attributes: { title: string; notes: string } };
      };
      expect(readBody.data.attributes.title).toContain("updated");
      expect(readBody.data.attributes.notes).toBe("updated note");

      const list = await request.get("/api/v1/attachments?limit=100", {
        headers,
      });
      expect(list.ok()).toBeTruthy();

      const deleted = await request.delete(
        `/api/v1/attachments/${attachmentId}`,
        { headers },
      );
      expect(deleted.status()).toBe(204);
      attachmentId = undefined;
    } finally {
      if (attachmentId)
        await request.delete(`/api/v1/attachments/${attachmentId}`, {
          headers,
        });
      await request.delete(`/api/v1/categories/${categoryId}`, { headers });
    }
  });
});
