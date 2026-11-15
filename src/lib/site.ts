export const SITE = {
  name: 'MagicPrintChile',
  url: 'https://magicprintchile.cl',
  phone: '+56 9 8638 1820',
  phoneRaw: '+56986381820',
  whatsapp: '56986381820',
  email: 'contacto@magicprintchile.cl',
  tagline: 'Galvanos, monedas, escudos de bronce y regalos corporativos personalizados',
  description:
    'MagicPrintChile: galvanos de bronce, cristal y metal, monedas conmemorativas, escudos institucionales, tazones, poleras, gorros bordados y chapitas personalizadas. Cotiza por WhatsApp.',
};

export const waLink = (text: string) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
