/**
 * globalvariables.ts
 **
 * function：global variables
**/

/** const */
// default
export namespace myConst {
  export const DEVMODE: boolean = true;
  export const COMPANY_NAME: string = "nthree";
  export const APP_NAME: string = "aozorascraper";
  export const LOG_LEVEL: string = "info";
  export const DEFAULT_ENCODING: string = "utf8";
  export const CSV_ENCODING: string = "SJIS";
  export const OUTPUT_PATH: string = "output";
  export const DEF_AOZORA_AUTHOR_URL: string = 'https://www.aozora.gr.jp/index_pages/person';
  export const DEF_AOZORA_BOOK_URL: string = 'https://www.aozora.gr.jp/index_pages/sakuhin';
}

// default
export namespace myNums {
  export const FIRST_BOOK_ROWS: number = 1;
  export const FIRST_PAGE_ROWS: number = 2;
  export const MAX_PAGE_ROWS: number = 52;
  export const WINDOW_WIDTH: number = 600; // window width
  export const WINDOW_HEIGHT: number = 1000; // window height
  export const MAX_AUTHORS: number = 2450;
}

// columns
export namespace myColumns {
  export const AUTHOR_COLUMNS: string[] = [
    'No', '作家名', '作家名読み', 'ローマ字表記', '生年', '没年', '人物について'
  ];

  export const BOOK_COLUMNS: string[] = [
    'No', '作品名', '作品名かな'
  ];

  export const TITLE_COLUMNS: string[] = [
    'No', '作品名', '文字遣い種別', '著者名', '著者基本名', '翻訳者名等'
  ];

  export const AUTHOR_COLUMNS_EN: string[] = [
    'No', 'author', 'authorruby', 'roman', 'birth', 'bod', 'about'
  ];

  export const TITLE_COLUMNS_EN: string[] = [
    'No', 'title', 'lettering', 'author', 'authorname', 'translator'
  ];
}

// selectors
export namespace mySelectors {
  export const ZIPLINK_SELECTOR: string = 'body > table.download > tbody > tr:nth-child(2) > td:nth-child(3) > a';
  export const FINALLINK_SELECTOR: string = 'body > center > table.list > tbody';
}

// links
export namespace myLinks {
  export const LINK_SELECTION: any = Object.freeze({
    あ: 'a',
    い: 'i',
    う: 'u',
    え: 'e',
    お: 'o',
    か: 'ka',
    き: 'ki',
    く: 'ku',
    け: 'ke',
    こ: 'ko',
    さ: 'sa',
    し: 'si',
    す: 'su',
    せ: 'se',
    そ: 'so',
    た: 'ta',
    ち: 'ti',
    つ: 'tu',
    て: 'te',
    と: 'to',
    な: 'na',
    に: 'ni',
    ぬ: 'nu',
    ね: 'ne',
    の: 'no',
    は: 'ha',
    ひ: 'hi',
    ふ: 'hu',
    へ: 'he',
    ほ: 'ho',
    ま: 'ma',
    み: 'mi',
    む: 'mu',
    め: 'me',
    も: 'mo',
    や: 'ya',
    ゆ: 'yu',
    よ: 'yo',
    ら: 'ra',
    り: 'ri',
    る: 'ru',
    れ: 're',
    ろ: 'ro',
    わ: 'wa',
    を: 'wo',
    ん: 'nn',
    A: 'zz',
  });

  // links number
  export const NUM_SELECTION: any = Object.freeze({
    あ: 21,
    い: 10,
    う: 7,
    え: 5,
    お: 14,
    か: 20,
    き: 14,
    く: 8,
    け: 8,
    こ: 17,
    さ: 11,
    し: 35,
    す: 5,
    せ: 18,
    そ: 6,
    た: 12,
    ち: 8,
    つ: 5,
    て: 8,
    と: 11,
    な: 6,
    に: 9,
    ぬ: 1,
    ね: 2,
    の: 3,
    は: 17,
    ひ: 10,
    ふ: 14,
    へ: 4,
    ほ: 7,
    ま: 6,
    み: 6,
    む: 4,
    め: 3,
    も: 4,
    や: 5,
    ゆ: 6,
    よ: 6,
    ら: 3,
    り: 3,
    る: 1,
    れ: 2,
    ろ: 3,
    わ: 7,
    A: 1,
  });
}
