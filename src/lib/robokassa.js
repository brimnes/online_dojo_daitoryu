/**
 * src/lib/robokassa.js
 *
 * Хелперы для интеграции с Робокассой.
 * Документация: https://docs.robokassa.ru/
 *
 * В отличие от ЮKassa, здесь нет REST-вызова «создать платёж» — платёжная
 * ссылка формируется на нашей стороне (MD5-подпись), а Робокасса потом сама
 * стучится на Result URL с другой подписью (Пароль #2).
 */

import { createHash } from 'crypto';

const MERCHANT_LOGIN = process.env.ROBOKASSA_MERCHANT_LOGIN;
const PASSWORD_1      = process.env.ROBOKASSA_PASSWORD_1;
const PASSWORD_2      = process.env.ROBOKASSA_PASSWORD_2;
const IS_TEST          = process.env.ROBOKASSA_TEST_MODE === '1';
// Система налогообложения для чека — уточнить в поддержке Робокассы для
// самозанятых (НПД); если не задана, поле в чек не попадает.
const SNO              = process.env.ROBOKASSA_SNO || null;

function md5(str) {
  return createHash('md5').update(str, 'utf-8').digest('hex');
}

/** Сумма в формате, который ждёт Робокасса — всегда ровно 2 знака после точки */
function fmtSum(amount) {
  return Number(amount).toFixed(2);
}

/**
 * Чек 54-ФЗ для одной позиции.
 * tax:'none' — самозанятые (НПД) НДС не платят.
 */
function buildReceipt({ title, amount }) {
  const item = {
    name:            title,
    quantity:        1,
    sum:             Number(Number(amount).toFixed(2)),
    tax:             'none',
    payment_method:  'full_payment',
    payment_object:  'service',
  };
  const receipt = { items: [item] };
  if (SNO) receipt.sno = SNO;
  return receipt;
}

/**
 * Строит URL оплаты Робокассы и возвращает вместе с InvId и объектом чека
 * (для сохранения в rawPayload).
 */
function buildPaymentUrl({ invId, amount, description, successUrl, failUrl }) {
  if (!MERCHANT_LOGIN || !PASSWORD_1) {
    throw new Error('Robokassa is not configured (ROBOKASSA_MERCHANT_LOGIN / ROBOKASSA_PASSWORD_1)');
  }

  const outSum  = fmtSum(amount);
  const receipt = buildReceipt({ title: description, amount });
  const receiptJson    = JSON.stringify(receipt);
  // Официальная документация Робокассы: Receipt должен быть URL-encoded
  // ДО того, как попадёт в строку для расчёта подписи (не сырой JSON).
  const receiptEncoded = encodeURIComponent(receiptJson);

  const signatureBase = `${MERCHANT_LOGIN}:${outSum}:${invId}:${receiptEncoded}:${PASSWORD_1}`;
  const signature = md5(signatureBase);

  // Строим URL вручную с единым encodeURIComponent для всех полей — чтобы
  // байты Receipt в самом URL совпадали ровно с тем, что ушло в подпись
  // (URLSearchParams использует другую схему кодирования: пробел → '+',
  // а не '%20', что дало бы иную строку и другую подпись).
  const qs = [
    ['MerchantLogin',  MERCHANT_LOGIN],
    ['OutSum',         outSum],
    ['InvId',          String(invId)],
    ['Description',    description],
    ['SignatureValue', signature],
    ['Receipt',        receiptJson],   // энкодим ниже сами, единообразно
    ['Culture',        'ru'],
    ...(successUrl ? [['SuccessURL2', successUrl]] : []),
    ...(failUrl    ? [['FailURL2',    failUrl]]    : []),
    ...(IS_TEST    ? [['IsTest',      '1']]        : []),
  ].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

  return {
    url: `https://auth.robokassa.ru/Merchant/Index.aspx?${qs}`,
    receipt,
  };
}

/**
 * Проверяет подпись Result URL (server-to-server callback).
 * Робокасса шлёт: OutSum, InvId, SignatureValue (+ Shp_* параметры, если были).
 * Формула: MD5(OutSum:InvId[:Shp_key=value...сорт. по алфавиту]:Пароль2)
 */
function verifyResultSignature({ outSum, invId, signatureValue, shpParams = {} }) {
  if (!PASSWORD_2) throw new Error('ROBOKASSA_PASSWORD_2 is not configured');

  const shpPart = Object.keys(shpParams)
    .sort()
    .map(k => `${k}=${shpParams[k]}`)
    .join(':');

  const base = shpPart
    ? `${outSum}:${invId}:${PASSWORD_2}:${shpPart}`
    : `${outSum}:${invId}:${PASSWORD_2}`;

  const expected = md5(base);
  return expected.toLowerCase() === String(signatureValue).toLowerCase();
}

/**
 * Запрашивает состояние платежа напрямую у Робокассы (OpState.php) —
 * используется как подстраховка, если Result URL по какой-то причине не дошёл.
 */
async function queryRobokassaStatus(invId) {
  if (!MERCHANT_LOGIN || !PASSWORD_2) {
    throw new Error('Robokassa is not configured (ROBOKASSA_MERCHANT_LOGIN / ROBOKASSA_PASSWORD_2)');
  }
  const signature = md5(`${MERCHANT_LOGIN}:${invId}:${PASSWORD_2}`);
  const params = new URLSearchParams({
    MerchantLogin: MERCHANT_LOGIN,
    InvoiceID:     String(invId),
    Signature:     signature,
  });

  const res = await fetch(`https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpStateExt?${params.toString()}`);
  if (!res.ok) throw new Error(`Robokassa OpState → HTTP ${res.status}`);
  const xml = await res.text();

  // Простой парсинг нужных полей из XML (без зависимостей)
  const stateCode = xml.match(/<Code>(\d+)<\/Code>/)?.[1];
  // 5 = ошибка, 10 = начально, 50 = деньги захолдированы, 100 = оплачено успешно
  const stateMatch = xml.match(/<State>\s*<Code>(\d+)<\/Code>/);
  return {
    raw:     xml,
    code:    stateMatch?.[1] ?? stateCode ?? null,
    succeeded: stateMatch?.[1] === '100',
  };
}

export { buildPaymentUrl, verifyResultSignature, queryRobokassaStatus, fmtSum, MERCHANT_LOGIN };
