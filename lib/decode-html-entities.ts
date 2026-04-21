const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  bdquo: '„',
  sbquo: '‚',
  laquo: '«',
  raquo: '»',
  copy: '©',
  reg: '®',
  trade: '™',
  middot: '·',
  bull: '•',
  deg: '°',
  euro: '€',
  pound: '£',
  Aacute: 'Á', aacute: 'á',
  Agrave: 'À', agrave: 'à',
  Acirc: 'Â',  acirc: 'â',
  Auml: 'Ä',   auml: 'ä',
  Aring: 'Å',  aring: 'å',
  Atilde: 'Ã', atilde: 'ã',
  AElig: 'Æ',  aelig: 'æ',
  Ccedil: 'Ç', ccedil: 'ç',
  Eacute: 'É', eacute: 'é',
  Egrave: 'È', egrave: 'è',
  Ecirc: 'Ê',  ecirc: 'ê',
  Euml: 'Ë',   euml: 'ë',
  Iacute: 'Í', iacute: 'í',
  Igrave: 'Ì', igrave: 'ì',
  Icirc: 'Î',  icirc: 'î',
  Iuml: 'Ï',   iuml: 'ï',
  Ntilde: 'Ñ', ntilde: 'ñ',
  Oacute: 'Ó', oacute: 'ó',
  Ograve: 'Ò', ograve: 'ò',
  Ocirc: 'Ô',  ocirc: 'ô',
  Ouml: 'Ö',   ouml: 'ö',
  Otilde: 'Õ', otilde: 'õ',
  Oslash: 'Ø', oslash: 'ø',
  Uacute: 'Ú', uacute: 'ú',
  Ugrave: 'Ù', ugrave: 'ù',
  Ucirc: 'Û',  ucirc: 'û',
  Uuml: 'Ü',   uuml: 'ü',
  Yacute: 'Ý', yacute: 'ý',
  Yuml: 'Ÿ',   yuml: 'ÿ',
  szlig: 'ß',
}

export function decodeHtmlEntities(input: string): string {
  if (!input) return input
  return input.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = parseInt(body.slice(2), 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    if (body.startsWith('#')) {
      const code = parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[body] ?? match
  })
}
