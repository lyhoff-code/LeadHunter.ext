// Lead Hunter AI - Message Draft Generator

/**
 * Generate a personalized outreach message draft
 * @param {object} data - Lead data including comment, author, platform, score, painPoints
 * @param {object} settings - User settings
 * @returns {string} - Generated message draft
 */
export function generateMessageDraft(data, settings = {}) {
  const { comment, author, platform, score, painPoints = [] } = data;
  const name = author?.name || 'there';
  const firstName = name.split(' ')[0];

  // Detect language (basic heuristic)
  const isSpanish = detectSpanish(comment);

  // Select template based on score and context
  if (score >= 8) {
    return isSpanish
      ? generateHotLeadMessageES(firstName, painPoints, comment, platform)
      : generateHotLeadMessageEN(firstName, painPoints, comment, platform);
  } else if (score >= 5) {
    return isSpanish
      ? generateWarmLeadMessageES(firstName, painPoints, comment, platform)
      : generateWarmLeadMessageEN(firstName, painPoints, comment, platform);
  } else {
    return isSpanish
      ? generateColdLeadMessageES(firstName, platform)
      : generateColdLeadMessageEN(firstName, platform);
  }
}

/**
 * Detect if text is primarily Spanish
 */
function detectSpanish(text) {
  const spanishIndicators = [
    'hola', 'que', 'como', 'está', 'tengo', 'necesito', 'mi', 'para',
    'pero', 'con', 'los', 'las', 'una', 'porque', 'cuando', 'llamadas',
    'negocio', 'empresa', 'clientes', 'telefono', 'citas'
  ];

  const lowerText = text.toLowerCase();
  const matches = spanishIndicators.filter(word => lowerText.includes(word)).length;

  return matches >= 2;
}

/**
 * Extract the main pain point from comment
 */
function extractMainPain(painPoints, comment) {
  if (painPoints && painPoints.length > 0) {
    return painPoints[0];
  }

  const lowerComment = comment.toLowerCase();

  if (lowerComment.includes('llamada') || lowerComment.includes('call')) {
    return 'llamadas perdidas';
  }
  if (lowerComment.includes('cita') || lowerComment.includes('appointment')) {
    return 'citas';
  }
  if (lowerComment.includes('mensaje') || lowerComment.includes('message')) {
    return 'mensajes';
  }
  if (lowerComment.includes('recepcion') || lowerComment.includes('reception')) {
    return 'recepción';
  }

  return 'comunicación con clientes';
}

// === SPANISH TEMPLATES ===

function generateHotLeadMessageES(firstName, painPoints, comment, platform) {
  const mainPain = extractMainPain(painPoints, comment);

  const templates = [
    `Hola ${firstName}! 👋

Vi tu comentario sobre ${mainPain} y me identifiqué totalmente - es un problema que veo mucho en negocios como el tuyo.

Trabajo con una solución de IA que contesta llamadas 24/7, agenda citas y nunca pierde un cliente. Varios negocios en tu industria ya la usan y han recuperado hasta 30% de leads que antes perdían.

¿Te gustaría que te cuente cómo funciona? Solo toma 15 minutos.

Saludos!`,

    `Hey ${firstName}!

Leí lo que comentaste sobre ${mainPain}. Conozco ese dolor - lo he visto en muchos negocios.

Hay una solución de IA que actúa como recepcionista virtual: contesta llamadas, agenda citas, responde preguntas... todo automático y 24/7.

¿Has considerado algo así? Puedo mostrarte cómo funciona si te interesa.`,

    `Hola ${firstName},

Tu comentario me llamó la atención. El tema de ${mainPain} es más común de lo que crees, y hay soluciones que realmente funcionan.

Trabajo con tecnología de IA para negocios que necesitan alguien que conteste siempre. Sin contratar personal extra.

¿Tienes 10 minutos para una demo rápida?`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateWarmLeadMessageES(firstName, painPoints, comment, platform) {
  const mainPain = extractMainPain(painPoints, comment);

  const templates = [
    `Hola ${firstName}! 👋

Vi tu post y quería compartir algo que podría ayudarte con el tema de ${mainPain}.

Hay herramientas de IA ahora que manejan llamadas y citas automáticamente. Algunos negocios las usan como "recepcionista virtual".

Si te interesa saber más, con gusto te cuento cómo funciona. Sin compromiso.

Saludos!`,

    `Hey ${firstName},

Interesante lo que mencionas. El tema de ${mainPain} es un reto común.

¿Has escuchado de los asistentes de IA para negocios? Básicamente contestan llamadas y agendan citas sin necesidad de personal.

Déjame saber si quieres más info!`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateColdLeadMessageES(firstName, platform) {
  return `Hola ${firstName}! 👋

Vi tu perfil/post y me pareció interesante conectar.

Trabajo en tecnología de IA para negocios - específicamente soluciones que ayudan con atención al cliente y llamadas.

Si alguna vez necesitas algo en ese espacio, aquí estoy!

Saludos`;
}

// === ENGLISH TEMPLATES ===

function generateHotLeadMessageEN(firstName, painPoints, comment, platform) {
  const mainPain = extractMainPain(painPoints, comment);

  const templates = [
    `Hey ${firstName}! 👋

I saw your comment about ${mainPain} and totally relate - it's a problem I see constantly with businesses like yours.

I work with an AI solution that answers calls 24/7, books appointments, and never misses a lead. Several businesses in your industry use it and have recovered up to 30% of leads they used to lose.

Would you like me to show you how it works? Just takes 15 minutes.

Cheers!`,

    `Hi ${firstName}!

Read what you mentioned about ${mainPain}. I know that pain - I've seen it in so many businesses.

There's an AI solution that works like a virtual receptionist: answers calls, schedules appointments, answers questions... all automatic and 24/7.

Have you considered something like this? I can show you how it works if you're interested.`,

    `Hey ${firstName},

Your comment caught my attention. The ${mainPain} issue is more common than you'd think, and there are solutions that actually work.

I work with AI technology for businesses that need someone to always answer. No extra staff required.

Got 10 minutes for a quick demo?`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateWarmLeadMessageEN(firstName, painPoints, comment, platform) {
  const mainPain = extractMainPain(painPoints, comment);

  const templates = [
    `Hey ${firstName}! 👋

Saw your post and wanted to share something that might help with ${mainPain}.

There are AI tools now that handle calls and appointments automatically. Some businesses use them as a "virtual receptionist".

If you want to know more, happy to explain how it works. No strings attached.

Cheers!`,

    `Hi ${firstName},

Interesting what you mentioned. The ${mainPain} thing is a common challenge.

Have you heard of AI assistants for businesses? They basically answer calls and book appointments without needing staff.

Let me know if you want more info!`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateColdLeadMessageEN(firstName, platform) {
  return `Hey ${firstName}! 👋

Saw your profile/post and thought it'd be good to connect.

I work in AI technology for businesses - specifically solutions that help with customer service and calls.

If you ever need anything in that space, I'm here!

Cheers`;
}

/**
 * Generate follow-up message
 */
export function generateFollowUp(lead, daysSince = 3) {
  const firstName = (lead.name || 'there').split(' ')[0];
  const isSpanish = detectSpanish(lead.comment);

  if (isSpanish) {
    return `Hola ${firstName}!

Te escribí hace unos días sobre el tema de las llamadas/citas.

¿Tuviste chance de pensarlo? Sigo disponible si quieres que te muestre cómo funciona la solución de IA.

Sin presión - solo quería dar seguimiento.

Saludos!`;
  }

  return `Hey ${firstName}!

I reached out a few days ago about the calls/appointments thing.

Did you get a chance to think about it? Still available if you want me to show you how the AI solution works.

No pressure - just wanted to follow up.

Cheers!`;
}
