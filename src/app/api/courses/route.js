/**
 * GET  /api/courses          — опубликованные тематические курсы (auth); ?admin=1 — все (admin)
 * POST /api/courses          — создать курс (admin). Тело: { id, title, ..., price }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth, requireAdmin } from '@/lib/auth-server.js';
import { courseToSnake, upsertCourseProduct } from './shared.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminMode = searchParams.get('admin') === '1';

  const { user, error } = adminMode ? await requireAdmin(request) : await requireAuth(request);
  if (error) return error;

  try {
    const [courses, products, access] = await Promise.all([
      prisma.course.findMany({
        where:   adminMode ? {} : { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        include: { videos: { orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.product.findMany({ where: { type: 'course' } }),
      prisma.userAccess.findMany({ where: { userId: user.id, type: 'course' }, select: { reference: true } }),
    ]);
    const owned = new Set(access.map(a => a.reference));
    return NextResponse.json(courses.map(c => courseToSnake(c, {
      product:   products.find(p => p.reference === c.id) ?? null,
      hasAccess: owned.has(c.id),
      withVideo: adminMode,
    })));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const id = String(body.id || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(id)) {
      return NextResponse.json({ error: 'ID курса: латиница, цифры и дефис (например, ukemi)' }, { status: 400 });
    }
    const course = await prisma.course.create({
      data: {
        id,
        title:       body.title       || 'Новый курс',
        subtitle:    body.subtitle    || '',
        description: body.description || '',
        kanji:       body.kanji       || '',
        imageUrl:    body.image_url   || null,
        sortOrder:   body.sort_order  ?? 0,
        isPublished: body.is_published ?? false,
      },
      include: { videos: true },
    });
    await upsertCourseProduct(prisma, id, {
      title: `Курс «${course.title}»`, price: body.price ?? 0, isActive: true,
    });
    const product = await prisma.product.findUnique({ where: { type_reference: { type: 'course', reference: id } } });
    return NextResponse.json({ ok: true, course: courseToSnake(course, { product, withVideo: true }) }, { status: 201 });
  } catch (e) {
    const msg = e.code === 'P2002' ? 'Курс с таким ID уже существует' : e.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
