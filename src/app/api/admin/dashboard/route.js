import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

// helper to get date N days ago
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

// month key like 'may-2026'
function monthKey(date) {
  const d = new Date(date);
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  return `${months[d.getMonth()]}-${d.getFullYear()}`;
}

// Russian month label
function monthLabel(key) {
  const [m] = key.split('-');
  const map = { jan:'янв', feb:'фев', mar:'мар', apr:'апр', may:'май', jun:'июн', jul:'июл', aug:'авг', sep:'сен', oct:'окт', nov:'ноя', dec:'дек' };
  return map[m] || m;
}

export async function GET(request) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const now = new Date();
    const ago7  = daysAgo(7);
    const ago30 = daysAgo(30);

    const [
      allUsers,
      allPayments,
      allAccess,
      allLessons,
      allTechniqueVideos,
      allTechniques,
      allComments,
      allKnowledgeComments,
    ] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, level: true, status: true, joinedAt: true },
        orderBy: { joinedAt: 'desc' },
      }),
      prisma.payment.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userAccess.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { paidAt: 'desc' },
      }),
      prisma.lesson.findMany({
        select: { id: true, videoStatus: true },
      }),
      prisma.techniqueVideo.findMany({
        select: { id: true, videoStatus: true },
      }),
      prisma.technique.findMany({
        select: { id: true },
      }),
      prisma.comment.findMany({
        where: { parentCommentId: null },
        select: { id: true, lessonId: true, userId: true, text: true, status: true, createdAt: true,
                  user: { select: { name: true } },
                  replies: { where: { isAdminReply: true }, select: { id: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.knowledgeComment.findMany({
        where: { parentCommentId: null },
        select: { id: true, knowledgeItemId: true, userId: true, text: true, status: true, createdAt: true,
                  user: { select: { name: true } },
                  replies: { where: { isAdminReply: true }, select: { id: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // ── Users ───────────────────────────────────────────────
    const users = {
      total:  allUsers.length,
      active: allUsers.filter(u => u.status === 'active').length,
      new7d:  allUsers.filter(u => u.joinedAt >= ago7).length,
      new30d: allUsers.filter(u => u.joinedAt >= ago30).length,
      recent: allUsers.slice(0, 5).map(u => ({
        id: u.id, name: u.name, email: u.email,
        level: u.level, status: u.status, joinedAt: u.joinedAt,
      })),
    };

    // ── Payments ─────────────────────────────────────────────
    const succeeded = allPayments.filter(p => p.status === 'succeeded');
    const totalRevenue = succeeded.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Last 6 months keys
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      const key = `${months[d.getMonth()]}-${d.getFullYear()}`;
      last6Months.push(key);
    }

    // Group succeeded payments by month
    const revenueMap = {};
    for (const p of succeeded) {
      if (!p.paidAt) continue;
      const key = monthKey(p.paidAt);
      revenueMap[key] = (revenueMap[key] || 0) + (parseFloat(p.amount) || 0);
    }

    const revenueByMonth = last6Months.map(key => ({
      month: key,
      label: monthLabel(key),
      amount: revenueMap[key] || 0,
    }));

    const payments = {
      totalRevenue,
      countSucceeded: succeeded.length,
      countPending:   allPayments.filter(p => p.status === 'pending').length,
      countCancelled: allPayments.filter(p => p.status === 'cancelled').length,
      revenueByMonth,
      recent: allPayments.slice(0, 5).map(p => ({
        id: p.id,
        userName: p.user?.name || null,
        productTitle: p.productTitle,
        productType: p.productType,
        productReference: p.productReference,
        amount: p.amount ? parseFloat(p.amount) : null,
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
    };

    // ── Access ───────────────────────────────────────────────
    const byType = { month: 0, section: 0 };
    for (const a of allAccess) {
      if (a.type === 'month')   byType.month++;
      else if (a.type === 'section') byType.section++;
    }

    const access = {
      total: allAccess.length,
      byType,
      recent: allAccess.slice(0, 5).map(a => ({
        id: a.id,
        userId: a.userId,
        userName: a.user?.name || null,
        type: a.type,
        reference: a.reference,
        paidAt: a.paidAt,
        amount: a.amount,
      })),
    };

    // ── Content ──────────────────────────────────────────────
    const lessonStatuses = { none: 0, uploading: 0, processing: 0, ready: 0, error: 0 };
    for (const l of allLessons) {
      const s = l.videoStatus || 'none';
      if (s in lessonStatuses) lessonStatuses[s]++;
      else lessonStatuses.none++;
    }

    const tvStatuses = { none: 0, uploading: 0, processing: 0, ready: 0, error: 0 };
    for (const v of allTechniqueVideos) {
      const s = v.videoStatus || 'none';
      if (s in tvStatuses) tvStatuses[s]++;
      else tvStatuses.none++;
    }

    const content = {
      lessons: { total: allLessons.length, byVideoStatus: lessonStatuses },
      techniqueVideos: { total: allTechniqueVideos.length, byVideoStatus: tvStatuses },
      techniques: { total: allTechniques.length },
    };

    // ── Comments (уроки + база знаний) ───────────────────────
    const allTopLevel = [
      ...allComments.map(c => ({ ...c, _type: 'lesson' })),
      ...allKnowledgeComments.map(c => ({ ...c, _type: 'knowledge' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const visibleTopLevel = allTopLevel.filter(c => c.status === 'visible');
    const unanswered = visibleTopLevel.filter(c => c.replies.length === 0).length;
    const answered   = visibleTopLevel.filter(c => c.replies.length > 0).length;
    const hidden     = allTopLevel.filter(c => c.status === 'hidden').length;

    const comments = {
      total: allTopLevel.length,
      unanswered,
      answered,
      hidden,
      recent: allTopLevel.slice(0, 5).map(c => ({
        id:       c.id,
        type:     c._type,
        lessonId: c._type === 'lesson' ? c.lessonId : null,
        knowledgeItemId: c._type === 'knowledge' ? c.knowledgeItemId : null,
        userName: c.user?.name || null,
        text:     c.text,
        status:   c.status,
        createdAt: c.createdAt,
      })),
    };

    return NextResponse.json({ users, payments, access, content, comments });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
