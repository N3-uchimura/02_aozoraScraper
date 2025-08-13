<table>
	<thead>
    	<tr>
      		<th style="text-align:center"><a href="README.md">English</a></th>
      		<th style="text-align:center">日本語</th>
    	</tr>
  	</thead>
</table>

## name

青空スクレイパー

## Overview

[aozora bunko](https://www.aozora.gr.jp/) からデータをスクレイピングするツールです。

## Requirement

Windows10 ~

## Usage

1. リリースから ZIP ファイルをダウンロードするか、リポジトリを pull します。
2. コマンドプロンプトを開き、解凍したフォルダか git フォルダ内に移動します。
   ```
   cd C:\home
   ```
3. 以下のコマンドを実行します。
   ```
   npm install
   npm start
   ```
4. 以下のいずれかを選択します。

- ファイル取得: 作品データ TXT ファイルを含んだ ZIP ファイルを、chrome で設定されているダウンロードフォルダに保存します。
- 作品取得: 作品データ取得 (作品名, 作品名かな)。
- 著者取得: 著者データ取得 (著者名, 生日, 没日, 著者について)。
- タイトル取得: 作品タイトル取得 (作品名, 自体・かな形式, 著者名, 訳・編者)。

4. Set options.
   - かな行選択 (「著者取得」以外)
     - 全: 全データを取得します。
     - それ以外: 取得対象のかな行（あ行～わ行）を選択します。
   - 著者番号選択(「著者取得」のみ)
     - 取得対象の著者番号を指定します。
5. 「スクレイピング」ボタンを押します。
6. 終了すると、csv ファイルが"resources/output/csv"の中に保存されます。

## Features

- 「設定」ボタンを押して設定ページに移動し、「日本語」のチェックを外すことで英語になります。

## Author

N3-Uchimura

## Licence

[MIT](https://mit-license.org/)
