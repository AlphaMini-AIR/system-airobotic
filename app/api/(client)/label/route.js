import { NextResponse } from 'next/server';
import dbConnect from '@/config/connectDB';
import Label from '@/models/label';

export async function POST(req) {
    try {
        await dbConnect();

        const { title, time, desc = '', color } = await req.json();

        if (!title || !time)
            return NextResponse.json(
                { message: 'Thiếu tiêu đề hoặc thời gian!' },
                { status: 400 },
            );

        const newLabel = await Label.create({
            title: title.trim(),
            at: new Date(time),
            desc: desc.trim(),
            ...(color && { color }),
        });

        return NextResponse.json(newLabel, { status: 201 });
    } catch (err) {
        console.error('[LABEL_CREATE]', err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        await dbConnect();
        const labels = await Label.find().sort({ at: -1 }).lean();
        return NextResponse.json(labels, { status: 200 });
    } catch (err) {
        console.error('[LABEL_GET]', err);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}