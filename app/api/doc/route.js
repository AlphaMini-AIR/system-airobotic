/**
 * @swagger
 * /api/doc:
 *   get:
 *     summary: Lấy OpenAPI Specification (Swagger JSON)
 *     description: Trả về file OpenAPI spec JSON cho toàn bộ API.
 *     tags:
 *       - Swagger
 *     responses:
 *       200:
 *         description: OpenAPI spec JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger.js'; 

export async function GET() {
    const spec = await getApiDocs();
    return NextResponse.json(spec);
}