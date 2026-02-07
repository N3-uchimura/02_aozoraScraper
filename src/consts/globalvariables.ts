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
  export const LOG_LEVEL: string = "all";
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
  export const WINDOW_WIDTH: number = 800;
  export const WINDOW_HEIGHT: number = 1000;
  export const MAX_AUTHORS: number = 2450;
}

// columns
export namespace myColumns {
  export const BOOK_COLUMNS: string[] = [
    'No', 'bookname', 'booknameruby', 'category'
  ];

  export const AUTHOR_COLUMNS: string[] = [
    'No', 'author', 'authorruby', 'roman', 'birth', 'bod', 'about'
  ];

  export const TITLE_COLUMNS: string[] = [
    'No', 'title', 'lettering', 'author', 'authorname', 'translator'
  ];
}

// selectors
export namespace mySelectors {
  export const ZIPLINK_SELECTOR: string = 'body > table.download > tbody > tr:nth-child(2) > td:nth-child(3) > a';
  export const BOOKLINK_SELECTOR: string = 'body > table:nth-child(4) > tbody > tr:nth-child(1) > td:nth-child(2)> font';
  export const BOOKRUBYLINK_SELECTOR: string = 'body > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(2)';
  export const TMPLINK_SELECTOR: string = 'body > table > tbody > tr:nth-child(1) > td:nth-child(2)';
  export const CATEGORYLINK_SELECTOR: string = 'body > table:nth-child(8) > tbody > tr:nth-child(1) > td:nth-child(2)';
  export const CATEGORYSUBLINK_SELECTOR: string = 'body > table:nth-child(9) > tbody > tr:nth-child(1) > td:nth-child(2)';
  export const titlelink = (num1: number, num2: number): string => {
    return `body > center > table.list > tbody > tr:nth-child(${num1}) > td:nth-child(${num2})`;;
  }
  export const authorlink = (num: number): string => {
    return `body > table > tbody > tr:nth-child(${num}) > td:nth-child(2)`;
  }
  export const finallink = (num: number): string => {
    return `body > center > table > tbody > tr:nth-child(${num}) > td:nth-child(2) > a`;
  }
  export const nolink = (num: number): string => {
    return `body > center > table > tbody > tr:nth-child(${num}) > td:nth-child(1)`;
  }
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
    か: 21,
    き: 14,
    く: 8,
    け: 8,
    こ: 17,
    さ: 11,
    し: 35,
    す: 5,
    せ: 19,
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
    は: 18,
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
    わ: 8,
    A: 1,
  });
}
