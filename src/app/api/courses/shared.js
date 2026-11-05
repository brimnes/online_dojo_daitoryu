/** Общие сериализаторы для /api/courses/* */

export function videoToSnake(v, { withVideo = true } = {}) {
  return {
    id: v.id, course_id: v.courseId, title: v.title, subtitle: v.subtitle ?? '',
    description: v.description, duration: v.duration, sort_order: v.sortOrder,
    // Без доступа ID видео не отдаём — плеер всё равно не пустит (kinescope/auth)
    video_provider: withVideo ? v.videoProvider  : null,
    video_id:       withVideo ? v.videoId        : null,
    video_status:   withVideo ? v.videoStatus    : null,
    video_poster_url: withVideo ? v.videoPosterUrl : null,
    errors_video_id:     withVideo ? (v.errorsVideoId ?? null) : null,
    errors_video_status: withVideo ? (v.errorsVideoStatus ?? 'none') : null,
    has_video: !!v.videoId,
    has_errors_video: !!v.errorsVideoId,
  };
}

export function courseToSnake(c, { product = null, hasAccess = false, withVideo = false } = {}) {
  return {
    id: c.id, title: c.title, subtitle: c.subtitle, description: c.description,
    kanji: c.kanji, image_url: c.imageUrl ?? null,
    sort_order: c.sortOrder, is_published: c.isPublished,
    created_at: c.createdAt, updated_at: c.updatedAt,
    video_count: (c.videos ?? []).length,
    videos: (c.videos ?? []).map(v => videoToSnake(v, { withVideo })),
    has_access: hasAccess,
    product: product ? {
      id: product.id, type: product.type, reference: product.reference,
      title: product.title, description: product.description,
      price: Number(product.price), is_active: product.isActive,
    } : null,
  };
}

/** Обновляет/создаёт продукт курса (type='course', reference=courseId) */
export async function upsertCourseProduct(prisma, courseId, { title, price, isActive }) {
  const data = {};
  if (title    !== undefined) data.title    = title;
  if (price    !== undefined) data.price    = Math.max(0, Math.round(Number(price) || 0));
  if (isActive !== undefined) data.isActive = !!isActive;
  if (!Object.keys(data).length) return;
  await prisma.product.upsert({
    where:  { type_reference: { type: 'course', reference: courseId } },
    create: { type: 'course', reference: courseId, title: data.title || courseId, price: data.price ?? 0, isActive: data.isActive ?? true },
    update: data,
  });
}
