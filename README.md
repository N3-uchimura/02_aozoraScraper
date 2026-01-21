<table>
	<thead>
    	<tr>
      		<th style="text-align:center">English</th>
      		<th style="text-align:center"><a href="README-ja.md">日本語</a></th>
    	</tr>
  	</thead>
</table>

## name

aozoraScraper

## Overview

This is scraping tool for [aozora bunko](https://www.aozora.gr.jp/).

## Requirement

Windows10 ~

## Setting

### From souce

1. Download zip or pull repository.
2. Execute below on cmd.

   ```
   npm install
   npm start
   ```

- node.js environment required.

### From exe

1. Download exe file from release.
2. DoubleClick on exe file and install.

## Usage

※ Root Directory is
all：「C:\Program Files\aozoraeditor」
user：「C:\Users\xxxx\AppData\Local\Programs\aozoraeditor」

1. Select mode.

- GetFiles: Get zip files which contain book's txt data. Download to "resources/output" directory.
- GetBooks: Get all book data (name, nameruby).
- GetAuthors: Get all author data (name, birthday, bod, about).
- GetTitles: Get all book's data (name, format, authorname, translator).
- GetCategories: Get all book's category (ex. NDC K913).

2. Set options.

- Select target 'kana' (exept for GetAuthors).
  - all: Get all data.
  - others: Get only target 'kana'.
- Select min and max for scraping. (only for GetAuthors).

3. Press "Scraping" button.
4. All finished, csv files will be on "resources/output" directory.

## Features

- You can change default language to English by pressing "Config" button and check off "japanese".

## Author

N3-Uchimura

## Licence

[MIT](https://mit-license.org/)
