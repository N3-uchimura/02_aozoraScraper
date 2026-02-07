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
import { readFile, writeFile } from 'node:fs/promises'; // promise fs
import { exec } from 'child_process'; // child process
import { BrowserWindow, app, ipcMain, Tray, Menu, nativeImage } from 'electron'; // electron
import NodeCache from 'node-cache'; // for cache
import { Scrape } from './class/ElScrape0123'; // scraper
import ELLogger from './class/ElLogger'; // logger
import Dialog from './class/ElDialog0721'; // dialog
import CSV from './class/ElCsv0126'; // csvmaker
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
// global quit
let globalQuitFlg: boolean = false;
// global path
let globalRootPath: string;
// global mode
let globalMode: number = 0;
// global json
let globalJsonArray: any[] = [];

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
        // mainWindow.webContents.openDevTools();
      }
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
app.on('ready', async (): Promise<void> => {
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
    await mkdirManager.mkDir(outputPath);
    // not exists
    if (!existsSync(languageTxtPath)) {
      logger.debug('app: making txt ...');
      // make txt file
      await writeFile(languageTxtPath, 'japanese');
    }
    // get language
    const language: string = await readFile(languageTxtPath, 'utf8');
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
    const icon: Electron.NativeImage = nativeImage.createFromPath(path.join(globalRootPath, 'assets', 'aozorascrape.ico'));
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
app.on('activate', (): void => {
  // no window
  if (BrowserWindow.getAllWindows().length === 0) {
    // reload
    createWindow();
  }
});

// close
app.on('before-quit', (): void => {
  // turn on close flg
  isQuiting = true;
});

// end
app.on('window-all-closed', (): void => {
  logger.info('app: close app');
  // exit
  app.quit();
});

/*
 IPC
*/
// ready
ipcMain.on("beforeready", async (event: any, _: any): Promise<void> => {
  try {
    logger.info("app: beforeready app");
    // language
    const language: string = cacheMaker.get('language') ?? 'japanese';
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

// open
ipcMain.on('open', async (_: any, __: any): Promise<void> => {
  try {
    logger.info('app: open dir');
    // path
    const tmpPath: string = path.join(globalRootPath, myConst.OUTPUT_PATH);
    // switch on OS
    const command = process.platform === 'win32' ? `explorer "${tmpPath}"` :
      process.platform === 'darwin' ? `open "${tmpPath}"` :
        `xdg-open "${tmpPath}"`;
    // open root dir
    exec(command);

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
ipcMain.on('config', async (event: any, _: any): Promise<void> => {
  try {
    logger.info('app: config app');
    // language
    const language: string = cacheMaker.get('language') ?? 'japanese';
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
ipcMain.on('save', async (event: any, arg: any): Promise<void> => {
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
ipcMain.on('top', async (event: any, _): Promise<void> => {
  try {
    logger.info('app: top');
    // goto config page
    await mainWindow.loadFile(path.join(globalRootPath, 'www', 'index.html'));
    // language
    const language: string = cacheMaker.get('language') ?? '';
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

// pause
ipcMain.on("pause", async (_: any, __: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info("ipc: pause mode");
      // mode
      let tmpModeStr: string = "";
      // mode
      let tmpColumns: string[] = [];
      // quit flg on
      globalQuitFlg = true;
      switch (globalMode) {
        case 1:
          tmpModeStr = "download";
          break;
        case 2:
          tmpModeStr = "book";
          tmpColumns = myColumns.BOOK_COLUMNS;
          break;
        case 3:
          tmpModeStr = "author";
          tmpColumns = myColumns.AUTHOR_COLUMNS;
          break;
        case 4:
          tmpModeStr = "title";
          tmpColumns = myColumns.TITLE_COLUMNS;
          break;
        default:
          console.log("out of mode");
      }
      // only except for download
      if (globalMode > 1) {
        // nowtime
        const nowTimeStr: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 14);
        // csv filename
        const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, `【${tmpModeStr}】${nowTimeStr}-halfway.csv`);
        // write data
        await csvMaker.makeCsvData(globalJsonArray.flat(), tmpColumns, filePath);
        logger.debug("CSV writing finished");
      }
      // show finished message
      dialogMaker.showmessage("info", "scraping stopped");
      resolve();

    } catch (e: unknown) {
      // error
      logger.error(e);
      // error
      if (e instanceof Error) {
        // show error
        dialogMaker.showmessage("error", `${e.message}`);
      }
      reject();
    } finally {
      // goto top
      await puppScraper.doClose();
    }
  });
});

// exit
ipcMain.on('exitapp', async (): Promise<void> => {
  try {
    logger.info('ipc: exit mode');
    // title
    let questionTitle: string = '';
    // message
    let questionMessage: string = '';
    // language
    const language: string = cacheMaker.get('language') ?? 'japanese';
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
ipcMain.on('download', async (event: any, arg: any): Promise<void> => {
  try {
    logger.info('ipc: download mode');
    // initial flg
    let initalFlg: boolean = true;
    // off flg
    globalQuitFlg = false;
    // set mode
    globalMode = 1;
    // num data
    const numArray: number[] = getArrayNum(arg);
    // init scraper
    await puppScraper.init();
    // allow multiple dl
    await puppScraper.allowMultiDl(path.join(globalRootPath, myConst.OUTPUT_PATH));

    // URL
    for await (const i of numArray) {
      try {
        if (globalQuitFlg) {
          // error
          throw new Error('prcess end.');
        }
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
          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);

          // inital
          if (initalFlg) {
            // URL
            event.sender.send('statusUpdate', {
              status: `${targetJa} 行`,
              target: 'downloading No.1'
            });
          }
          initalFlg = false;

          // loop
          for await (const j of nums) {
            try {
              if (globalQuitFlg) {
                // error
                throw new Error('prcess end.');
              }
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
                  if (globalQuitFlg) {
                    // error
                    throw new Error('prcess end.');
                  }
                  // selector
                  const finalLinkSelector: string = mySelectors.finallink(k);
                  // wait for 2sec
                  await puppScraper.doWaitFor(2000);
                  logger.debug(`download: downloading No.${k - 1}`);
                  // wait and click
                  await Promise.all([
                    // wait 1sec
                    await puppScraper.doWaitFor(1000),
                    // url
                    await puppScraper.doClick(finalLinkSelector),
                  ]);
                  // wait 1sec
                  await puppScraper.doWaitFor(1000);
                  // selector exists
                  if (!await puppScraper.doCheckSelector(mySelectors.ZIPLINK_SELECTOR)) {
                    break;
                  }
                  // get href
                  const zipHref: string = await puppScraper.getHref(mySelectors.ZIPLINK_SELECTOR);
                  logger.silly(zipHref);

                  if (zipHref.includes('.zip')) {
                    await Promise.all([
                      // wait for 1sec
                      await puppScraper.doWaitFor(1000),
                      // download zip
                      await puppScraper.doDownload(mySelectors.ZIPLINK_SELECTOR),
                      // wait for 1sec
                      await puppScraper.doWaitFor(1000),
                      // goback
                      await puppScraper.doGoBack(),
                    ]);

                  } else {
                    // error
                    throw new Error('err4: not zip file');
                  }

                } catch (err1: unknown) {
                  logger.error(err1);

                } finally {
                  // URL
                  event.sender.send('statusUpdate', {
                    status: `${targetJa} 行`,
                    target: `downloading No.${k}`
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
    // not quitting
    if (!globalQuitFlg) {
      // end message
      showCompleteMessage();
      logger.info('ipc: download completed');
    }

  } catch (e: unknown) {
    logger.error(e);

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// book scrape
ipcMain.on('bookscrape', async (event: any, arg: any): Promise<void> => {
  try {
    logger.info('ipc: bookscrape mode');
    // initial flg
    let initalFlg: boolean = true;
    // init array
    globalJsonArray = [];
    // off flg
    globalQuitFlg = false;
    // set mode
    globalMode = 2;
    // num data
    const numArray: number[] = getArrayNum(arg);
    // init scraper
    await puppScraper.init();

    // loop
    for await (const i of numArray) {
      try {
        if (globalQuitFlg) {
          // error
          throw new Error('prcess end.');
        }
        // target kana
        const targetJa: string = Object.keys(myLinks.LINK_SELECTION)[i];
        // target english kana
        const targetEn: any = Object.values(myLinks.LINK_SELECTION)[i];
        logger.debug(`bookscrape: getting ${targetJa} 行`);
        // loop number
        const childLength: number = myLinks.NUM_SELECTION[targetJa];
        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`bookscrape: total is ${childLength}`);
          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);

          // loop
          for await (const j of nums) {
            try {
              if (globalQuitFlg) {
                // error
                throw new Error('prcess end.');
              }
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}_${targetEn}${j}.html`;
              logger.debug(`bookscrape: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              logger.debug('bookscrape: doUrlScrape mode');
              // loop number
              const links: number[] = makeNumberRange(myNums.FIRST_PAGE_ROWS, myNums.MAX_PAGE_ROWS);

              // inital
              if (initalFlg) {
                // URL
                event.sender.send('statusUpdate', {
                  status: `${targetJa} 行 ${j}`,
                  target: 'scraping No.1'
                });
              }
              initalFlg = false;

              // loop
              for await (const k of links) {
                try {
                  if (globalQuitFlg) {
                    // error
                    throw new Error('prcess end.');
                  }
                  // category
                  let targetstring: string = '';
                  // selector
                  const finalLinkSelector: string = mySelectors.finallink(k);
                  // selector exists
                  if (!await puppScraper.doCheckSelector(finalLinkSelector)) {
                    break;
                  }
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
                      bookname: '', // bookname
                      booknameruby: '', // bookname ruby
                      category: '', // category
                    };

                    // bookname
                    const bookname: string = await puppScraper.doSingleEval(mySelectors.BOOKLINK_SELECTOR, 'innerHTML');
                    // bookname ruby
                    const booknameruby: string = await puppScraper.doSingleEval(mySelectors.BOOKRUBYLINK_SELECTOR, 'innerHTML');
                    // targetstring
                    targetstring = await puppScraper.doSingleEval(mySelectors.CATEGORYLINK_SELECTOR, 'innerHTML');
                    // if blank reget
                    if (targetstring.includes('仮名') || targetstring.includes('年')) {
                      targetstring = '';
                    } else if (targetstring == '') {
                      targetstring = await puppScraper.doSingleEval(mySelectors.CATEGORYSUBLINK_SELECTOR, 'innerHTML');
                    }
                    // set each value
                    tmpObj.No = String(k - 1);
                    tmpObj.bookname = bookname;
                    tmpObj.booknameruby = booknameruby;
                    tmpObj.category = targetstring;
                    // set to json
                    globalJsonArray.push(tmpObj);
                    logger.debug(`bookscrape: ${bookname}`);
                    // goback
                    await puppScraper.doGoBack();

                  } else {
                    // error
                    throw new Error('err4: no download link');
                  }

                } catch (err1: unknown) {
                  logger.error(err1);

                } finally {
                  // URL
                  event.sender.send('statusUpdate', {
                    status: `${targetJa} 行 ${j}`,
                    target: `scraping No.${k}`
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
        // not quitting
        if (!globalQuitFlg) {
          // csv columns
          const bookColumns: string[] = myColumns.BOOK_COLUMNS;
          // nowtime
          const nowTimeStr: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 14);
          // csv filename
          const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, `【book】${nowTimeStr}_${targetJa}行.csv`);
          // write data
          await csvMaker.makeCsvData(globalJsonArray, bookColumns, filePath);
        }

      } catch (err3: unknown) {
        logger.error(err3);
      }
    }
    // not quitting
    if (!globalQuitFlg) {
      // end message
      showCompleteMessage();
      logger.info('ipc: bookscrape completed');
    } else {
      // error
      throw new Error('prcess end.');
    }

  } catch (e: unknown) {
    logger.error(e);

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// authorscrape
ipcMain.on('authorscrape', async (event: any, arg: any): Promise<void> => {
  try {
    logger.info('ipc: authorscrape mode');
    // init array
    globalJsonArray = [];
    // off flg
    globalQuitFlg = false;
    // set mode
    globalMode = 3;
    // no
    const startNo: number = Number(arg.start);
    const endNo: number = Number(arg.end);
    // init scraper
    await puppScraper.init();
    // URL
    logger.debug(`authorscrape: total is ${endNo}`);
    // for loop
    const nums: number[] = makeNumberRange(startNo, endNo);

    // loop
    for await (const i of nums) {
      try {
        if (globalQuitFlg) {
          // error
          throw new Error('prcess end.');
        }
        // URL
        const aozoraUrl: string = `${myConst.DEF_AOZORA_AUTHOR_URL}${i}.html`;
        logger.silly(`authorscrape: scraping ${aozoraUrl}`);
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
        // move to top
        await puppScraper.doGo(aozoraUrl);
        logger.silly('bookscrape: doUrlScrape mode');
        // row loop number
        const rows: number[] = makeNumberRange(1, 6);
        // insert no.
        tmpObj[myColumns.AUTHOR_COLUMNS[0]] = i.toString();
        // URL
        event.sender.send('statusUpdate', {
          status: `No.${1}`, // status
          target: `scraping Page.${i}` // page
        });

        // loop
        for await (const j of rows) {
          try {
            if (globalQuitFlg) {
              // error
              throw new Error('prcess end.');
            }
            logger.silly(`authorscrape: scraping No.${j}`);
            // target column
            const targetColumn: string = myColumns.AUTHOR_COLUMNS[j];
            // selector
            let finalLinkSelector: string = mySelectors.authorlink(j);
            // selector exists
            if (!await puppScraper.doCheckSelector(finalLinkSelector)) {
              logger.silly(`No.${j}: no selector`);
              break;
            }
            // when title link
            if (j == 1) {
              finalLinkSelector += ' > font'
            }
            // wait for 2sec
            await puppScraper.doWaitFor(500);
            // wait and click
            const targetstring: string = await puppScraper.doSingleEval(finalLinkSelector, 'innerHTML');
            // set to tmpObj
            tmpObj[targetColumn] = targetstring;
            logger.silly(`authorscrape: ${targetstring}`);
            // wait 0.5 sec
            await puppScraper.doWaitFor(500);

          } catch (err1: unknown) {
            logger.error(err1);

          } finally {
            // URL
            event.sender.send('statusUpdate', {
              status: `No.${j}`, // status
              target: `scraping Page.${i}` // page
            });
          }
        }
        // set to finalArray
        globalJsonArray.push(tmpObj);
        // wait for 1sec
        await puppScraper.doWaitFor(1000);

      } catch (err2: unknown) {
        logger.error(err2);
      }
    }
    // not quitting
    if (!globalQuitFlg) {
      logger.debug('authorscrape: making csv...');
      // nowtime
      const nowTimeStr: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 14);
      // csv filename
      const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, `【author】${nowTimeStr}-${startNo}_${endNo}.csv`);
      // write data
      await csvMaker.makeCsvData(globalJsonArray, myColumns.AUTHOR_COLUMNS, filePath);
      // wait for 1sec
      await puppScraper.doWaitFor(1000);
      // end message
      showCompleteMessage();
      logger.info('ipc: authorscrape completed');
    }

  } catch (e: unknown) {
    logger.error(e);

  } finally {
    // close scraper
    await puppScraper.doClose();
  }
});

// titlescrape
ipcMain.on('titlescrape', async (event: any, arg: any): Promise<void> => {
  try {
    logger.info('ipc: titlescrape mode');
    // initial flg
    let initalFlg: boolean = true;
    // init array
    globalJsonArray = [];
    // off flg
    globalQuitFlg = false;
    // set mode
    globalMode = 4;

    // init scraper
    await puppScraper.init();
    // num data
    const numArray: number[] = getArrayNum(arg);

    // URL
    for await (const i of numArray) {
      try {
        if (globalQuitFlg) {
          // error
          throw new Error('prcess end.');
        }
        // target kana
        const targetJa: string = Object.keys(myLinks.LINK_SELECTION)[i];
        // target english kana
        const targetEn: any = Object.values(myLinks.LINK_SELECTION)[i];
        logger.debug(`titlescrape: getting ${targetJa} 行`);
        // loop number
        const childLength: number = myLinks.NUM_SELECTION[targetJa];
        // inital
        if (initalFlg) {
          // URL
          event.sender.send('statusUpdate', {
            status: `${targetJa} 行 1`,
            target: `scraping No.${1}`
          });
        }
        initalFlg = false;

        // within total 
        if (childLength >= myNums.FIRST_BOOK_ROWS) {
          logger.debug(`titlescrape: total is ${childLength}`);
          // for loop
          const nums: number[] = makeNumberRange(myNums.FIRST_BOOK_ROWS, childLength + 1);
          // loop
          for await (const j of nums) {
            try {
              if (globalQuitFlg) {
                // error
                throw new Error('prcess end.');
              }
              // tmp array
              let tmpArray: any = [];
              // URL
              const aozoraUrl: string = `${myConst.DEF_AOZORA_BOOK_URL}_${targetEn}${j}.html`;
              logger.silly(`titlescrape: scraping ${aozoraUrl}`);
              // move to top
              await puppScraper.doGo(aozoraUrl);
              // row loop number
              const rows: number[] = makeNumberRange(myNums.FIRST_PAGE_ROWS, myNums.MAX_PAGE_ROWS);
              // column loop number
              const columns: number[] = makeNumberRange(0, 6);

              // loop
              for await (const k of rows) {
                try {
                  if (globalQuitFlg) {
                    // error
                    throw new Error('prcess end.');
                  }
                  tmpArray = [];
                  // empty array
                  let tmpObj: { [key: string]: string } = {
                    No: '', // number
                    title: '', // title
                    lettering: '', // ruby
                    author: '', // authorname
                    authorname: '', // authorbasename
                    translator: '', // editor
                  };
                  // loop
                  for await (const m of columns) {
                    try {
                      if (globalQuitFlg) {
                        // error
                        throw new Error('prcess end.');
                      }
                      // target column
                      const targetColumn: string = myColumns.TITLE_COLUMNS[m];
                      // selector
                      let finalLinkSelector: string = mySelectors.titlelink(k, m + 1);
                      // when title link
                      if (m == 1) {
                        finalLinkSelector += ' > a';
                      }
                      // wait for 2sec
                      await puppScraper.doWaitFor(500);
                      // wait and click
                      const targetstring: string = await puppScraper.doSingleEval(finalLinkSelector, 'innerHTML');
                      console.log(targetColumn);
                      console.log(targetstring);
                      // set to tmpObj
                      tmpObj[targetColumn] = targetstring;

                      logger.silly(`titlescrape: ${targetstring}`);
                      // wait 0.5 sec
                      await puppScraper.doWaitFor(500);

                    } catch (err1: unknown) {
                      logger.error(err1);
                    }

                  }
                  // push into tmp array
                  tmpArray.push(tmpObj);

                } catch (err2: unknown) {
                  logger.error(err2);

                } finally {
                  // URL
                  event.sender.send('statusUpdate', {
                    status: `${targetJa} 行`, // status
                    target: `Page.${j} No.${k}` // page
                  });
                }
                // set to finalArray
                globalJsonArray.push(tmpArray);
              }
              // wait for 1sec
              await puppScraper.doWaitFor(1000);

            } catch (err3: unknown) {
              logger.error(err3);
            }
          }
          // not quitting
          if (!globalQuitFlg) {
            logger.debug('titlescrape: making csv...');
            // nowtime
            const nowTimeStr: string = (new Date).toISOString().replace(/[^\d]/g, '').slice(0, 14);
            // csv filename
            const filePath: string = path.join(globalRootPath, myConst.OUTPUT_PATH, `【title】${nowTimeStr}_${targetJa}行.csv`);
            // write data
            await csvMaker.makeCsvData(globalJsonArray.flat(), myColumns.TITLE_COLUMNS, filePath);
          }
        }

      } catch (err4: unknown) {
        logger.error(err4);
      }
    }
    // not quitting
    if (!globalQuitFlg) {
      // end message
      showCompleteMessage();
      logger.info('ipc: titlescrape completed');
    }

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

// number array
const getArrayNum = (arg: string): number[] => {
  // startIndex
  let startIndex: number = 0;
  // lastIndex
  let lastIndex: number = 0;
  logger.debug(arg);
  // hit index
  if (arg == 'all') {
    startIndex = 0;
    lastIndex = Object.values(myLinks.LINK_SELECTION).length - 1;
  } else {
    startIndex = Object.values(myLinks.LINK_SELECTION).indexOf(arg);
    lastIndex = startIndex + 5;
  }
  // not included
  if (startIndex == -1) {
    // error
    throw new Error('download: not index');
  }
  // for loop
  return makeNumberRange(startIndex, lastIndex);
}

// comp message
const showCompleteMessage = (): void => {
  // message
  let completeMessage: string = '';
  // language
  const language: string = cacheMaker.get('language') ?? 'japanese';
  // japanese
  if (language == 'japanese') {
    completeMessage = '終了しました。';
  } else {
    completeMessage = 'completed!';
  }
  // end message
  dialogMaker.showmessage('info', completeMessage);
}