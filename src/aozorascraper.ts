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
import { Scrape } from './class/ElScrapeCore0719'; // scraper
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
if (app.isPackaged) {
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
    // makedir
    await mkdirManager.mkDir('output');
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
  logger.info("app: beforeready app");
  // language
  const language = cacheMaker.get('language') ?? 'japanese';
  // be ready
  event.sender.send("ready", language);
});

// config
ipcMain.on('config', async (event: any, _) => {
  logger.info('app: config app');
  // language
  const language = cacheMaker.get('language') ?? 'japanese';
  // goto config page
  await mainWindow.loadFile(path.join(globalRootPath, 'www', 'config.html'));
  // language
  event.sender.send('confready', language);
});

// save
ipcMain.on('save', async (event: any, arg: any) => {
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
  event.sender.send('topready', language);
});

// top
ipcMain.on('top', async (event: any, _) => {
  logger.info('app: top');
  // goto config page
  await mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
  // language
  const language = cacheMaker.get('language') ?? '';
  // language
  event.sender.send('topready', language);
});

// exit
ipcMain.on('exitapp', async () => {
  try {
    logger.info('ipc: exit mode');
    // selection
    const selected: number = dialogMaker.showQuetion('question', 'exit', 'exit? data is exposed');

    // when yes
    if (selected == 0) {
      // close
      app.quit();
    }

  } catch (e: unknown) {
    logger.error(e);
  }
});

// scraping
ipcMain.on('scrape', async (event: any, _: any) => {
  try {
    logger.info('ipc: scrape mode');
    // success
    let successCounter: number = 0;
    // fail
    let failCounter: number = 0;
    // init scraper
    await puppScraper.init();

    // URL
    for await (const [key, value] of Object.entries(myLinks.LINK_SELECTION)) {
      try {
        logger.debug(`scrape: getting ${key} 行`);
        // loop number
        const childLength: number = myLinks.NUM_SELECTION[key];

        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`scrape: total is ${childLength}`);
          // update total
          event.sender.send('total', childLength * 50);
          // now URL
          event.sender.send('statusUpdate', {
            status: '',
            target: `${key} 行`
          });
          logger.debug('scrape: doPageScrape mode');

          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);

          // loop
          for await (const j of nums) {
            try {
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}_${value}${j}.html`;
              logger.debug(`scrape: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              // wait 1 sec
              await puppScraper.doWaitFor(1000);
              logger.debug('scrape: doUrlScrape mode');
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
                    logger.debug(`scrape: downloading No.${k - 1}`);
                    // wait and click
                    await Promise.all([
                      // wait 1sec
                      await puppScraper.doWaitFor(1000),
                      // url
                      await puppScraper.doClick(finalLinkSelector),
                      // wait 2sec
                      await puppScraper.doWaitFor(2000),
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
    logger.info('ipc: scrape completed');

  } catch (e: unknown) {
    logger.error(e);

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// authorscrape
ipcMain.on('authorscrape', async (event: any, _: any) => {
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
    const nums: number[] = makeNumberRange(1, myNums.MAX_AUTHORS);

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
        // wait 1 sec
        await puppScraper.doWaitFor(1000);
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
        // URL
        event.sender.send('statusUpdate', {
          status: '',
          target: `downloading Page.${i}`
        });
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
    // csv filename
    const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, `${fileName}.csv`);
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
        };
        // set each value
        tmpObj.No = author[0];
        tmpObj.作家名 = author[1];
        tmpObj.作家名読み = author[2];
        tmpObj.ローマ字表記 = author[3];
        tmpObj.生年 = author[4];
        tmpObj.没年 = author[5];
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
        };
        // set each value
        tmpObj.No = author[0];
        tmpObj.author = author[1];
        tmpObj.authorruby = author[2];
        tmpObj.roman = author[3];
        tmpObj.birth = author[4];
        tmpObj.bod = author[5];
        // set to json
        finalJsonArray.push(tmpObj);
      });
      // csv columns
      authorColumns = myColumns.AUTHOR_COLUMNS_EN;
    }

    logger.debug('authorscrape: making csv...');
    // write data
    await csvMaker.makeCsvData(finalJsonArray, authorColumns, filePath);
    // wait for 1sec
    await puppScraper.doWaitFor(1000);
    // end message
    dialogMaker.showmessage('info', 'completed.');
    logger.info('ipc: authorscrape completed');

  } catch (e: unknown) {
    logger.error(e);

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// titlescrape
ipcMain.on('titlescrape', async (event: any, _: any) => {
  try {
    logger.info('ipc: titlescrape mode');
    // csv columns
    let titleColumns: string[] = [];
    // filename
    const fileName: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 8);
    // init scraper
    await puppScraper.init();
    // language
    const language = cacheMaker.get('language') ?? 'japanese';
    // URL
    for await (const [key, value] of Object.entries(myLinks.LINK_SELECTION)) {
      try {
        logger.debug(`titlescrape: getting ${key} 行`);
        // last array
        let wholeArray: any = [];
        // success
        let successCounter: number = 0;
        // faile
        let failCounter: number = 0;
        // loop number
        const childLength: number = myLinks.NUM_SELECTION[key];

        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`titlescrape: total is ${childLength}`);
          // update total
          event.sender.send('total', childLength * myNums.MAX_PAGE_ROWS);
          // now URL
          event.sender.send('statusUpdate', {
            status: '',
            target: `${key} 行`
          });

          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);
          // loop
          for await (const i of nums) {
            try {
              // last array
              let finalArray: string[][] = [];
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}_${value}${i}.html`;
              logger.silly(`titlescrape: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              // wait 1 sec
              await puppScraper.doWaitFor(1000);
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
          // csv filename
          const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, `${fileName}_${key}行.csv`);
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
