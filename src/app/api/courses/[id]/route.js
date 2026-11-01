/**
 * GET    /api/courses/[id] — опубликованный курс (auth). Видео — только при доступе.
 * PUT    /api/courses/[id] — обновить курс и его цену (admin)
 * DELETE /api/courses/[id] — удалить курс (admin). Продукт деактивируется,
 *                            доступы пользователей не удаляются.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth, requireAdmin } from '@/lib/auth-server.js';
import { courseToSnake, upsertCourseProduct } from '../shared.js';

export async function GET(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const isStaff = user.role === 'admin' || user.role === 'teacher';
    const course = await prisma.course.findFirst({
      where:   isStaff ? { id: params.id } : { id: params.id, isPublished: true },
      include: { videos: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [product, access] = await Promise.all([
      prisma.product.findUnique({ where: { type_reference: { type: 'course', reference: course.id } } }),
      prisma.userAccess.findFirst({ where: { userId: user.id, type: 'course', reference: course.id } }),
    ]);
    const hasAccess = !!access;
    return NextResponse.json(courseToSnake(course, { product, hasAccess, withVideo: hasAccess || isStaff }));
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const data = {};
    if (body.title        !== undefined) data.title       = body.title;
    if (body.subtitle     !== undefined) data.subtitle    = body.subtitle;
    if (body.description  !== undefined) data.description = body.description;
    if (body.kanji        !== undefined) data.kanji       = body.kanji;
    if (body.sort_order   !== undefined) data.sortOrder   = Number(body.sort_order) || 0;
    if (body.is_published !== undefined) data.isPublished = !!body.is_published;
    if (body.video_provider !== undefined) data.videoProvider = body.video_provider;
    if (body.video_id       !== undefined) data.videoId       = body.video_id || null;
    if (body.video_status   !== undefined) data.videoStatus   = body.video_status;

    const course = await prisma.course.update({
      where: { id: params.id }, data,
      include: { videos: { orderBy: { sortOrder: 'asc' } } },
    });
    await upsertCourseProduct(prisma, course.id, {
      price: body.price,
      title: body.title !== undefined ? `Курс «${course.title}»` : undefined,
    });
    const product = await prisma.product.findUnique({ where: { type_reference: { type: 'course', reference: course.id } } });
    return NextResponse.json({ ok: true, course: courseToSnake(course, { product, withVideo: true }) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await prisma.course.delete({ where: { id: params.id } });
    await prisma.product.updateMany({ where: { type: 'course', reference: params.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
