/*
 * aozorascraper.ts
 *
 * aozorascraper - aozora scrape tools -
 **/

'use strict';

/// Constants
// namespace
import { myConst, myLinks, myNums, myColumns, mySelectors } from './consts/globalvariables';


/// Modules
import * as path from 'node:path'; // path
import { existsSync } from 'node:fs'; // file system
import { readFile, writeFile } from 'node:fs/promises'; // filesystem
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from 'electron'; // electron
import NodeCache from 'node-cache'; // for cache
import { Scrape } from './class/ElScrapeCore0810'; // scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0721'; // dialog
import CSV from './class/ElCsv0414'; // csvmaker
import MKDir from './class/ElMkdir0414'; // mdkir
// log level
const LOG_LEVEL: string = myConst.LOG_LEVEL ?? 'all';
// loggeer instance
const logger: ELLogger = new ELLogger(myConst.COMPANY_NAME, myConst.APP_NAME, LOG_LEVEL);
// csv instance
const csvMaker = new CSV(myConst.CSV_ENCODING, logger);
// dialog instance
const dialogMaker: Dialog = new Dialog(logger);
// mkdir instance
const mkdirManager = new MKDir(logger);
// cache
const cacheMaker: NodeCache = new NodeCache();
// scraper instance
const puppScraper: Scrape = new Scrape(logger);

/// interfaces
// window option
interface windowOption {
  width: number; // window width
  height: number; // window height
  defaultEncoding: string; // default encode
  webPreferences: Object; // node
}

/*
 main
*/
// main window
let mainWindow: Electron.BrowserWindow;
// quit flg
let isQuiting: boolean;
// global path
let globalRootPath: string;

// set rootpath
if (!myConst.DEVMODE) {
  globalRootPath = path.join(path.resolve(), 'resources');
} else {
  globalRootPath = path.join(__dirname, '..');
}

// create main window
const createWindow = (): void => {
  try {
    // window options
    const windowOptions: windowOption = {
      width: myNums.WINDOW_WIDTH, // window width
      height: myNums.WINDOW_HEIGHT, // window height
      defaultEncoding: myConst.DEFAULT_ENCODING, // encoding
      webPreferences: {
        nodeIntegration: false, // node
        contextIsolation: true, // isolate
        preload: path.join(__dirname, 'preload.js'), // preload
      }
    }
    // Electron window
    mainWindow = new BrowserWindow(windowOptions);
    // hide menubar
    mainWindow.setMenuBarVisibility(false);
    // index.html load
    mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
    // ready
    mainWindow.once('ready-to-show', () => {
      // dev mode
      if (!app.isPackaged) {
        //mainWindow.webContents.openDevTools();
      }
    });

    // stay at tray
    mainWindow.on('minimize', (event: any): void => {
      // avoid Wclick
      event.preventDefault();
      // hide window
      mainWindow.hide();
      // returnfalse
      event.returnValue = false;
    });

    // close window
    mainWindow.on('close', (event: any): void => {
      // not closing
      if (!isQuiting && process.platform !== 'darwin') {
        // quit
        app.quit();
        // return false
        event.returnValue = false;
      }
    });

    // closing
    mainWindow.on('closed', (): void => {
      // destroy window
      mainWindow.destroy();
    });

  } catch (e: unknown) {
    logger.error(e);
  }
}

// enable sandbox
app.enableSandbox();

// main app
app.on('ready', async () => {
  try {
    logger.info('app: electron is ready');
    // create window
    createWindow();
    // menu label
    let displayLabel: string = '';
    // close label
    let closeLabel: string = '';
    // txt path
    const languageTxtPath: string = path.join(globalRootPath, 'assets', 'language.txt');
    // output path
    const outputPath: string = path.join(globalRootPath, myConst.OUTPUT_PATH);
    // makedir
    await mkdirManager.mkDirAll([outputPath, path.join(outputPath, 'csv')]);
    // not exists
    if (!existsSync(languageTxtPath)) {
      logger.debug('app: making txt ...');
      // make txt file
      await writeFile(languageTxtPath, 'japanese');
    }
    // get language
    const language = await readFile(languageTxtPath, 'utf8');
    logger.debug(`language is ${language}`);
    // japanese
    if (language == 'japanese') {
      // set menu label
      displayLabel = '表示';
      // set close label
      closeLabel = '閉じる';
    } else {
      // set menu label
      displayLabel = 'show';
      // set close label
      closeLabel = 'close';
    }
    // cache
    cacheMaker.set('language', language);
    // icons
    const icon: Electron.NativeImage = nativeImage.createFromPath(path.join(globalRootPath, 'assets', 'aozora.ico'));
    // tray
    const mainTray: Electron.Tray = new Tray(icon);
    // context menu
    const contextMenu: Electron.Menu = Menu.buildFromTemplate([
      // show
      {
        label: displayLabel,
        click: () => {
          mainWindow.show();
        }
      },
      // close
      {
        label: closeLabel,
        click: () => {
          app.quit();
        }
      }
    ]);
    // context menu
    mainTray.setContextMenu(contextMenu);
    // Wclick reopen
    mainTray.on('double-click', () => mainWindow.show());

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// activate
app.on('activate', () => {
  // no window
  if (BrowserWindow.getAllWindows().length === 0) {
    // reload
    createWindow();
  }
});

// close
app.on('before-quit', () => {
  // turn on close flg
  isQuiting = true;
});

// end
app.on('window-all-closed', () => {
  logger.info('app: close app');
  // exit
  app.quit();
});

/*
 IPC
*/
// ready
ipcMain.on("beforeready", async (event: any, __) => {
  try {
    logger.info("app: beforeready app");
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
    // be ready
    event.sender.send("ready", language);
  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// config
ipcMain.on('config', async (event: any, _) => {
  try {
    logger.info('app: config app');
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
    // goto config page
    await mainWindow.loadFile(path.join(globalRootPath, 'www', 'config.html'));
    // language
    event.sender.send('confready', language);
  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// save
ipcMain.on('save', async (event: any, arg: any) => {
  try {
    logger.info('app: save config');
    // language
    const language: string = String(arg.language);
    // txt path
    const languageTxtPath: string = path.join(globalRootPath, "assets", "language.txt");
    // make txt file
    await writeFile(languageTxtPath, language);
    // cache
    cacheMaker.set('language', language);
    // goto config page
    await mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
    // language
    event.sender.send('ready', language);
  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// top
ipcMain.on('top', async (event: any, _) => {
  try {
    logger.info('app: top');
    // goto config page
    await mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
    // language
    const language = cacheMaker.get('language') ?? '';
    // language
    event.sender.send('topready', language);
  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// exit
ipcMain.on('exitapp', async () => {
  try {
    logger.info('ipc: exit mode');
    // title
    let questionTitle: string = '';
    // message
    let questionMessage: string = '';
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
    // japanese
    if (language == 'japanese') {
      questionTitle = '終了';
      questionMessage = '終了していいですか';
    } else {
      questionTitle = 'exit';
      questionMessage = 'exit?';
    }
    // selection
    const selected: number = dialogMaker.showQuetion('question', questionTitle, questionMessage);

    // when yes
    if (selected == 0) {
      // close
      app.quit();
    }

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }
  }
});

// download
ipcMain.on('download', async (event: any, arg: any) => {
  try {
    logger.info('ipc: download mode');
    // success
    let successCounter: number = 0;
    // fail
    let failCounter: number = 0;
    // num data
    const numArray: number[] = getArrayNum(arg);
    // init scraper
    await puppScraper.init();

    // URL
    for await (const i of numArray) {
      try {
        // target kana
        const targetJa: string = Object.keys(myLinks.LINK_SELECTION)[i];
        // target english kana
        const targetEn: any = Object.values(myLinks.LINK_SELECTION)[i];
        logger.debug(`download: getting ${targetJa} 行`);
        // loop number
        const childLength: number = myLinks.NUM_SELECTION[targetJa];

        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`download: total is ${childLength}`);
          // update total
          event.sender.send('total', childLength * 50);
          // now URL
          event.sender.send('statusUpdate', {
            status: '',
            target: `${targetJa} 行`
          });
          logger.debug('download: doPageScrape mode');

          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);

          // loop
          for await (const j of nums) {
            try {
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}_${targetEn}${j}.html`;
              logger.debug(`download: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              logger.debug('download: doUrlScrape mode');
              // loop number
              const links: number[] = makeNumberRange(myNums.FIRST_PAGE_ROWS, myNums.MAX_PAGE_ROWS);

              // loop
              for await (const k of links) {
                try {
                  // selector
                  const finalLinkSelector: string = `${mySelectors.FINALLINK_SELECTOR} > tr:nth-child(${k}) > td:nth-child(2) > a`;
                  // wait for 2sec
                  await puppScraper.doWaitFor(2000);

                  // selector exists
                  if (await puppScraper.doCheckSelector(finalLinkSelector)) {
                    logger.debug(`download: downloading No.${k - 1}`);
                    // wait and click
                    await Promise.all([
                      // wait 1sec
                      await puppScraper.doWaitFor(1000),
                      // url
                      await puppScraper.doClick(finalLinkSelector),
                    ]);
                    // get href
                    const zipHref: string = await puppScraper.getHref(mySelectors.ZIPLINK_SELECTOR);
                    logger.silly(zipHref);

                    if (zipHref.includes('.zip')) {
                      await Promise.all([
                        // wait for 1sec
                        await puppScraper.doWaitFor(1000),
                        // wait for datalist
                        await puppScraper.doWaitSelector(mySelectors.ZIPLINK_SELECTOR, 3000),
                        // download zip
                        await puppScraper.doClick(mySelectors.ZIPLINK_SELECTOR),
                        // allow multiple dl
                        await puppScraper.allowMultiDl(),
                        // wait for 3sec
                        await puppScraper.doWaitFor(3000),
                        // goback
                        await puppScraper.doGoBack(),
                      ]);
                      // success
                      successCounter++;

                    } else {
                      // error
                      throw new Error('err4: not zip file');
                    }

                  } else {
                    // error
                    throw new Error('err4: no download link');
                  }

                } catch (err1: unknown) {
                  logger.error(err1);

                } finally {
                  // URL
                  event.sender.send('statusUpdate', {
                    status: '',
                    target: `downloading No.${k - 1}`
                  });
                  // update total
                  event.sender.send('update', {
                    success: successCounter,
                    fail: failCounter,
                  });
                }
              }
              // wait for 1sec
              await puppScraper.doWaitFor(1000);

            } catch (err2: unknown) {
              logger.error(err2);
            }
          }
        }

      } catch (err3: unknown) {
        logger.error(err3);
      }
    }
    // end message
    dialogMaker.showmessage('info', 'completed.');
    logger.info('ipc: download completed');

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// book scrape
ipcMain.on('bookscrape', async (event: any, arg: any) => {
  try {
    logger.info('ipc: bookscrape mode');
    // success
    let successCounter: number = 0;
    // fail
    let failCounter: number = 0;
    // finaljson
    let finalJsonArray: any[] = [];
    // num data
    const numArray: number[] = getArrayNum(arg);
    // init scraper
    await puppScraper.init();

    // loop
    for await (const i of numArray) {
      try {
        // target kana
        const targetJa: string = Object.keys(myLinks.LINK_SELECTION)[i];
        // target english kana
        const targetEn: any = Object.values(myLinks.LINK_SELECTION)[i];
        logger.debug(`bookscrape: getting ${targetJa} 行`);
        // init array
        finalJsonArray = [];
        // loop number
        const childLength: number = myLinks.NUM_SELECTION[targetJa];

        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`bookscrape: total is ${childLength}`);
          // update total
          event.sender.send('total', childLength * 50);
          // now URL
          event.sender.send('statusUpdate', {
            status: `${targetJa} 行`,
            target: ``
          });
          logger.debug('bookscrape: doPageScrape mode');

          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);

          // loop
          for await (const j of nums) {
            try {
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}_${targetEn}${j}.html`;
              logger.debug(`bookscrape: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              logger.debug('bookscrape: doUrlScrape mode');
              // loop number
              const links: number[] = makeNumberRange(myNums.FIRST_PAGE_ROWS, myNums.MAX_PAGE_ROWS);

              // loop
              for await (const k of links) {
                try {
                  // selector
                  const finalLinkSelector: string = `${mySelectors.FINALLINK_SELECTOR} > tr:nth-child(${k}) > td:nth-child(2) > a`;
                  // wait for 2sec
                  await puppScraper.doWaitFor(1000);

                  // selector exists
                  if (await puppScraper.doCheckSelector(finalLinkSelector)) {
                    logger.debug(`bookscrape: scraping No.${k - 1}`);
                    // wait and click
                    await Promise.all([
                      // wait 1sec
                      await puppScraper.doWaitFor(1000),
                      // url
                      await puppScraper.doClick(finalLinkSelector),
                    ]);
                    // wait for 2sec
                    await puppScraper.doWaitFor(500);
                    // empty array
                    let tmpObj: { [key: string]: string } = {
                      No: '', // number
                      作品名: '', // bookname
                      作品名かな: '', // bookname ruby
                    };
                    // bookname selector
                    const bookLinkSelector: string = `body > table:nth-child(4) > tbody > tr:nth-child(1) > td:nth-child(2)> font`;
                    // bookname ruby selector
                    const rubyLinkSelector: string = `body > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(2)`;
                    // bookname
                    const bookname: string = await puppScraper.doSingleEval(bookLinkSelector, 'innerHTML');
                    // bookname ruby
                    const booknameruby: string = await puppScraper.doSingleEval(rubyLinkSelector, 'innerHTML');
                    // set each value
                    tmpObj.No = String(k - 1);
                    tmpObj.作品名 = bookname;
                    tmpObj.作品名かな = booknameruby;
                    // set to json
                    finalJsonArray.push(tmpObj);
                    // goback
                    await puppScraper.doGoBack();

                  } else {
                    // error
                    throw new Error('err4: no download link');
                  }

                } catch (err1: unknown) {
                  logger.error(err1);
                  // failCounter
                  failCounter++;

                } finally {
                  // successcounter
                  successCounter++;
                  // URL
                  event.sender.send('statusUpdate', {
                    status: `${targetJa} 行`,
                    target: `downloading No.${k - 1}`
                  });
                  // update total
                  event.sender.send('update', {
                    success: successCounter,
                    fail: failCounter,
                  });
                }
              }
              // wait for 1sec
              await puppScraper.doWaitFor(1000);

            } catch (err2: unknown) {
              logger.error(err2);
            }
          }
        }
        // csv columns
        const bookColumns: string[] = myColumns.BOOK_COLUMNS;
        // filename
        const fileName: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 8);
        // csv filename
        const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, 'csv', `${fileName}_${targetJa}行.csv`);
        // write data
        await csvMaker.makeCsvData(finalJsonArray, bookColumns, filePath);

      } catch (err3: unknown) {
        logger.error(err3);
      }
    }
    // end message
    dialogMaker.showmessage('info', 'completed.');
    logger.info('ipc: bookscrape completed');

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// authorscrape
ipcMain.on('authorscrape', async (event: any, arg: any) => {
  try {
    logger.info('ipc: authorscrape mode');
    // success
    let successCounter: number = 0;
    // faile
    let failCounter: number = 0;
    // author array
    let authorColumns: string[] = [];
    // last array
    let finalArray: string[][] = [];
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
    // filename
    const fileName: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 8);
    // init scraper
    await puppScraper.init();
    // URL
    logger.debug(`authorscrape: total is ${myNums.MAX_AUTHORS}`);
    // update total
    event.sender.send('total', myNums.MAX_AUTHORS);
    logger.debug('authorscrape: doPageScrape mode');

    // for loop
    //const nums: number[] = makeNumberRange(1, myNums.MAX_AUTHORS);
    const nums: number[] = makeNumberRange(870, 880);
    // loop
    for await (const i of nums) {
      try {
        // tmp array
        let tmpArray: string[] = [];
        // URL
        const aozoraUrl: string = `${myConst.DEF_AOZORA_AUTHOR_URL}${i}.html`;
        logger.debug(`authorscrape: scraping ${aozoraUrl}`);
        // move to top
        await puppScraper.doGo(aozoraUrl);
        logger.debug('authorscrape: doAuthorScrape mode');
        // row loop number
        const rows: number[] = makeNumberRange(1, 6);
        // insert no.
        tmpArray.push(i.toString());

        // loop
        for await (const j of rows) {
          try {
            logger.silly(`authorscrape: scraping No.${j - 1}`);
            // selector
            let finalLinkSelector: string = `body > table > tbody > tr:nth-child(${j}) > td:nth-child(2)`;
            // when title link
            if (j == 1) {
              finalLinkSelector += ' > font';
            }
            // wait for 2sec
            await puppScraper.doWaitFor(500);
            // wait and click
            const targetstring: string = await puppScraper.doSingleEval(finalLinkSelector, 'innerHTML');
            // set to tmparray
            tmpArray.push(targetstring);
            // wait 0.5 sec
            await puppScraper.doWaitFor(500);

          } catch (err1: unknown) {
            logger.error(err1);
          } finally {
            // URL
            event.sender.send('statusUpdate', {
              status: `No.${j - 1}`,
              target: `downloading Page.${i}`
            });
          }
        }
        // set to finalArray
        finalArray.push(tmpArray);
        // wait for 1sec
        await puppScraper.doWaitFor(1000);

      } catch (err2: unknown) {
        logger.error(err2);
        // fail
        failCounter++;
      } finally {
        // update total
        event.sender.send('update', {
          success: successCounter,
          fail: failCounter,
        });
      }
      // successcounter
      successCounter++;
      // wait for 1sec
      await puppScraper.doWaitFor(1000);
    }

    // finaljson
    let finalJsonArray: any[] = [];
    // language
    if (language == 'japanese') {
      // for training
      finalArray.forEach((author: any) => {
        // empty array
        let tmpObj: { [key: string]: string } = {
          No: '', // number
          作家名: '', // authorname
          作家名読み: '', // ruby
          ローマ字表記: '', // roman
          生年: '', // birth
          没年: '', // dod
          人物について: '', // aboug
        };
        // set each value
        tmpObj.No = author[0];
        tmpObj.作家名 = author[1];
        tmpObj.作家名読み = author[2];
        tmpObj.ローマ字表記 = author[3];
        tmpObj.生年 = author[4];
        tmpObj.没年 = author[5];
        tmpObj.人物について = author[6];
        // set to json
        finalJsonArray.push(tmpObj);
      });
      // csv columns
      authorColumns = myColumns.AUTHOR_COLUMNS;
    } else {
      // for training
      finalArray.forEach((author: any) => {
        // empty array
        let tmpObj: { [key: string]: string } = {
          No: '', // number
          author: '', // authorname
          authorruby: '', // ruby
          roman: '', // roman
          birth: '', // birth
          bod: '', // dod
          about: '', // about
        };
        // set each value
        tmpObj.No = author[0];
        tmpObj.author = author[1];
        tmpObj.authorruby = author[2];
        tmpObj.roman = author[3];
        tmpObj.birth = author[4];
        tmpObj.bod = author[5];
        tmpObj.about = author[6];
        // set to json
        finalJsonArray.push(tmpObj);
      });
      // csv columns
      authorColumns = myColumns.AUTHOR_COLUMNS_EN;
    }
    logger.debug('authorscrape: making csv...');
    // csv filename
    const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, 'csv', `${fileName}.csv`);
    // write data
    await csvMaker.makeCsvData(finalJsonArray, authorColumns, filePath);
    // wait for 1sec
    await puppScraper.doWaitFor(1000);
    // end message
    dialogMaker.showmessage('info', 'completed.');
    logger.info('ipc: authorscrape completed');

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// titlescrape
ipcMain.on('titlescrape', async (event: any, arg: any) => {
  try {
    logger.info('ipc: titlescrape mode');
    // csv columns
    let titleColumns: string[] = [];
    // num data
    const numArray: number[] = getArrayNum(arg);
    // filename
    const fileName: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 8);
    // init scraper
    await puppScraper.init();
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
    // URL
    for await (const i of numArray) {
      try {
        // target kana
        const targetJa: string = Object.keys(myLinks.LINK_SELECTION)[i];
        // target english kana
        const targetEn: any = Object.values(myLinks.LINK_SELECTION)[i];
        logger.debug(`titlescrape: getting ${targetJa} 行`);
        // last array
        let wholeArray: any = [];
        // success
        let successCounter: number = 0;
        // faile
        let failCounter: number = 0;
        // loop number
        const childLength: number = myLinks.NUM_SELECTION[targetJa];

        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`titlescrape: total is ${childLength}`);
          // update total
          event.sender.send('total', childLength * myNums.MAX_PAGE_ROWS);
          // now URL
          event.sender.send('statusUpdate', {
            status: '',
            target: `${targetJa} 行`
          });

          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);
          // loop
          for await (const i of nums) {
            try {
              // last array
              let finalArray: string[][] = [];
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}_${targetEn}${i}.html`;
              logger.silly(`titlescrape: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              // row loop number
              const rows: number[] = makeNumberRange(myNums.FIRST_PAGE_ROWS, myNums.MAX_PAGE_ROWS);
              // column loop number
              const columns: number[] = makeNumberRange(1, 6);

              // loop
              for await (const j of rows) {
                try {
                  // tmp array
                  let tmpArray: string[] = [];
                  // loop
                  for await (const k of columns) {
                    try {
                      // selector
                      let finalLinkSelector: string = `body > center > table.list > tbody > tr:nth-child(${j}) > td:nth-child(${k})`;
                      // when title link
                      if (k == 2) {
                        finalLinkSelector += ' > a';
                      }
                      // wait for 2sec
                      await puppScraper.doWaitFor(500);
                      // wait and click
                      const targetstring: string = await puppScraper.doSingleEval(finalLinkSelector, 'innerHTML');
                      logger.silly(`titlescrape: ${targetstring}`);
                      // set to tmparray
                      tmpArray.push(targetstring);
                      // wait 0.5 sec
                      await puppScraper.doWaitFor(500);

                    } catch (err1: unknown) {
                      logger.error(err1);
                    }
                  }
                  // set to finalArray
                  finalArray.push(tmpArray);
                  // successcounter
                  successCounter++;

                } catch (err2: unknown) {
                  logger.error(err2);

                } finally {
                  // URL
                  event.sender.send('statusUpdate', {
                    status: '',
                    target: `Page.${i - 1} No.${j - 1}`
                  });
                  // update total
                  event.sender.send('update', {
                    success: successCounter,
                    fail: failCounter,
                  });
                }
              }
              // put into wholearray
              wholeArray.push(finalArray);
              // wait for 1sec
              await puppScraper.doWaitFor(1000);

            } catch (err3: unknown) {
              logger.error(err3);
            }
          }

          // finaljson
          let finalJsonArray: any[] = [];
          // all races
          wholeArray.forEach((books: any) => {
            // language
            if (language == 'japanese') {
              // for training
              books.forEach((book: any) => {
                // empty array
                let tmpObj: { [key: string]: string } = {
                  No: '', // number
                  作品名: '', // title
                  文字遣い種別: '', // ruby
                  著者名: '', // authorname
                  著者基本名: '', // authorbasename
                  翻訳者名等: '', // editor
                };
                // set each value
                tmpObj.No = book[0];
                tmpObj.作品名 = book[1];
                tmpObj.文字遣い種別 = book[2];
                tmpObj.著者名 = book[3];
                tmpObj.著者基本名 = book[4];
                tmpObj.翻訳者名等 = book[5];
                // set to json
                finalJsonArray.push(tmpObj);
              });
              // csv columns
              titleColumns = myColumns.TITLE_COLUMNS;
            } else {
              // for training
              books.forEach((book: any) => {
                // empty array
                let tmpObj: { [key: string]: string } = {
                  No: '', // number
                  title: '', // title
                  lettering: '', // ruby
                  author: '', // authorname
                  authorname: '', // authorbasename
                  translator: '', // editor
                };
                // set each value
                tmpObj.No = book[0];
                tmpObj.title = book[1];
                tmpObj.lettering = book[2];
                tmpObj.author = book[3];
                tmpObj.authorname = book[4];
                tmpObj.translator = book[5];
                // set to json
                finalJsonArray.push(tmpObj);
              });
              // csv columns
              titleColumns = myColumns.TITLE_COLUMNS_EN;
            }
          });
          logger.debug('titlescrape: making csv...');
          // csv filename
          const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, 'csv', `${fileName}_${targetJa}行.csv`);
          // write data
          await csvMaker.makeCsvData(finalJsonArray, titleColumns, filePath);
        }

      } catch (err4: unknown) {
        logger.error(err4);
      }
    }
    logger.info('ipc: titlescrape completed');
    // end message
    dialogMaker.showmessage('info', 'completed.');

  } catch (e: unknown) {
    logger.error(e);
    // error
    if (e instanceof Error) {
      // error message
      dialogMaker.showmessage('error', e.message);
    }

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

/*
 Functions
*/
// number array
const makeNumberRange = (start: number, end: number) => [...new Array(end - start).keys()].map(n => n + start);

// number array
const getArrayNum = (arg: string): number[] => {
  // numIndex
  let numIndex: number = 0;
  // hit index
  if (arg == 'all') {
    numIndex = 0;
  } else {
    numIndex = Object.values(myLinks.LINK_SELECTION).indexOf(arg);
  }
  // not included
  if (numIndex == -1) {
    // error
    throw new Error('download: not index');
  }
  // for loop
  return makeNumberRange(numIndex, numIndex + 4);
}