## name
aozoraScraper

## Overview
This is scraping tool for [aozora bunko](https://www.aozora.gr.jp/).  

## Requirement
Windows10 ~  

## Usage
1. Download zip or pull repository.
2. Execute below on cmd.
   ```
   npm install
   npm start
   ```
3. Select mode.
+ GetFiles: Get zip files which contain book's txt data. Download to chrome's default dir.
+ GetAuthors: Get all author data (name, birthday, bod).
+ GetTitles: Get all book's data (name, format, authorname, translator).
4. Press "Scraping" button.
5. All finished, csv files will be on "output" directory.

## Features
+ You can change default language to English by pressing "Config" button and check off "japanese".

## Author
N3-Uchimura

## Licence
[MIT](https://mit-license.org/)
