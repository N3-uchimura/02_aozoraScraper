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

## Setting

### From souce

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

### From exe

1. リリースから EXE ファイルをダウンロードします。
2. ダウンロードした EXE ファイルを実行し、インストールします。

## Usage

1. 以下のいずれかを選択します。

- ファイル取得: 作品データ TXT ファイルを含んだ ZIP ファイルを、「resources/output」に保存します。
- 作品取得: 作品データ取得 (作品名, 作品名かな)。
- 著者取得: 著者データ取得 (著者名, 生日, 没日, 著者について)。
- タイトル取得: 作品タイトル取得 (作品名, 字体・かな形式, 著者名, 訳・編者)。
- カテゴリ取得: 作品カテゴリ取得 (例: NDC K913)。

2. オプション選択

- かな行選択 (「著者取得」以外)
  - 全: 全データを取得します。
  - それ以外: 取得対象のかな行（あ行～わ行）を選択します。
- 著者番号選択(「著者取得」のみ)
- 取得対象の著者番号を指定します。

3. 「スクレイピング」ボタンを押します。
4. 終了すると、csv ファイルが「resources/output」の中に保存されます。

## Features

- 「設定」ボタンを押して設定ページに移動し、「日本語」のチェックを外すことで英語になります。

## Author

N3-Uchimura

## Licence

[MIT](https://mit-license.org/)
