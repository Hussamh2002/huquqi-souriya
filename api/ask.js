// Vercel serverless function. Requires AI_API_URL, AI_API_KEY and AI_MODEL environment variables.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "الطريقة غير مسموحة" });
  const { question, year } = req.body || {};
  if (typeof question !== "string" || !question.trim() || question.length > 4000) {
    return res.status(400).json({ error: "اكتب سؤالاً صالحاً لا يتجاوز 4000 حرف." });
  }
  const { AI_API_URL, AI_API_KEY, AI_MODEL } = process.env;
  if (!AI_API_URL || !AI_API_KEY || !AI_MODEL) {
    return res.status(503).json({ error: "لم يتم إعداد خدمة الذكاء الاصطناعي بعد. أضف متغيرات البيئة المطلوبة في إعدادات الاستضافة." });
  }
  try {
    const upstream = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "أنت مساعد تعليمي لطلاب الحقوق باللغة العربية، مع اهتمام بالقانون السوري. لا تخترع مواد قانونية أو أرقام مواد أو أحكاماً أو مصادر. إذا لم تكن متأكداً من النص النافذ، قل ذلك صراحة واطلب التحقق من الجريدة الرسمية أو مصدر حكومي موثوق. فرّق بين الشرح الدراسي والاستشارة القانونية. اذكر أن الإجابة تعليمية وليست استشارة. لا تدّع أنك بحثت في قاعدة بيانات حية إلا إذا أتاحها مزود الخدمة فعلاً. أجب بإيجاز منظم." },
          { role: "user", content: `المستوى الدراسي: ${String(year || "غير محدد").slice(0,40)}\nالسؤال: ${question.trim()}` }
        ],
        temperature: 0.2
      })
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(502).json({ error: "تعذر على مزود الذكاء الاصطناعي معالجة السؤال. تحقق من الإعدادات والرصيد." });
    const answer = payload.choices?.[0]?.message?.content;
    if (!answer) return res.status(502).json({ error: "لم تصل إجابة مفهومة من المزود." });
    return res.status(200).json({ answer, sources: [] });
  } catch {
    return res.status(502).json({ error: "تعذر الاتصال بمزود الذكاء الاصطناعي." });
  }
}
