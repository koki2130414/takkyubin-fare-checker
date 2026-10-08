# かんたん宅急便送料チェック（非公式）

**公開URL: https://213nouen.jp/**

栃木県下野市から発送するお米のご注文について、**お米の代金とヤマト運輸「宅急便」の
基本運賃の目安**を確認できる Web サイトです。購入者がお届け先（都道府県）と
「ご希望のお米の量」（注文フォームと同じ選択肢）と個数を選ぶと、お米の代金・送料・
お支払い総額を表示します。

> **このサイトはヤマト運輸株式会社の公式サイトではありません。**
> 同社とは一切関係のない非公式ツールです。ヤマト運輸およびクロネコヤマトのロゴ・
> 公式キャラクターは使用していません。

## サイトの目的

- ネットショップの購入者などが、注文前に送料の目安を自分で確認できるようにする
- 入力された住所や荷物情報を保存・送信せず、ブラウザ上だけで計算を完結させる
- 料金データの出典・確認日・適用開始日を画面上に明示し、鵜呑みにされないようにする

## 技術構成

| 項目 | 内容 |
| --- | --- |
| フレームワーク | Next.js 16（App Router） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| テスト | Vitest |
| 出力 | `output: "export"` による静的サイト（サーバー・DB なし） |
| パッケージ管理 | npm |

送料計算はすべてクライアント側の純粋関数で行います。API Route もデータベースもありません。

## セットアップ方法

Node.js 20 以上（推奨: 22 以上）が必要です。

```bash
cd takkyubin-fare-site
npm install
```

## 開発サーバーの起動方法

```bash
npm run dev
```

http://localhost:3000 を開いてください。

## テスト方法

```bash
npm run test          # 1 回実行
npm run test:watch    # 変更を監視して実行
```

あわせて lint と型チェックも実行できます。

```bash
npm run lint
npm run typecheck
```

## ビルド方法

```bash
npm run build
```

静的ファイルが `out/` に出力されます。ローカルで確認する場合は、任意の静的サーバーで
`out/` を配信してください（例: `npx serve out`）。

## GitHub Pages へのデプロイ方法

`main` ブランチへ push すると、GitHub Actions（`.github/workflows/deploy.yml`）が
lint・型チェック・テスト・ビルドを実行し、`out/` を GitHub Pages へ自動デプロイします。

初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** に設定してください。

### 独自ドメイン（213nouen.jp）

- `public/CNAME` にドメイン名を置いています。GitHub の **Settings → Pages → Custom domain**
  にも同じ値を設定し、**Enforce HTTPS** を有効にします
- DNS（お名前.com）では、ホスト名を空欄にした **A レコードを 4 つ**登録します

  ```
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
  ```

- ルート配信なので `NEXT_PUBLIC_BASE_PATH` は**指定しません**。
  `koki2130414.github.io/リポジトリ名/` のようなサブパス配信に戻す場合のみ、
  `.github/workflows/deploy.yml` のビルドステップに
  `NEXT_PUBLIC_BASE_PATH: /takkyubin-fare-checker` を追加してください
- ドメインを変更するときは、`public/CNAME`・GitHub の Custom domain・DNS の 3 か所を
  合わせて変更します

## Vercel へのデプロイ方法

1. このリポジトリを GitHub などに push する
2. Vercel で「Add New… → Project」からリポジトリをインポートする
3. **Root Directory** に `takkyubin-fare-site` を指定する
   （リポジトリ直下がこのプロジェクトの場合は指定不要）
4. Framework Preset は `Next.js` のまま、環境変数の設定は不要
5. 「Deploy」を押す

`next.config.ts` で `output: "export"` を指定しているため、静的サイトとして配信されます。
Vercel はルート配信なので `NEXT_PUBLIC_BASE_PATH` の設定は不要です。

## お米の選択肢の更新方法

注文フォームの選択肢や価格を変えたときは、**`src/data/rice-products.ts` の
`RICE_PRODUCTS`** だけを更新します。

```ts
export const RICE_PRODUCTS: readonly RiceProduct[] = [
  { id: "5kg", label: "箱込み5キロ", grossWeightKg: 5, priceYen: 2700 },
  //                                  ↑箱込みの重量        ↑お米の代金（送料は含まない）
];
```

- `grossWeightKg` は**箱を含んだ発送重量**です。宅急便のサイズ区分はこの値から
  判定します（`src/lib/size.ts` の `judgeSizeByWeight`）
- 注文フォームの「※直接受け取り」の選択肢は配送しない（送料が発生しない）ため、
  `RICE_PRODUCTS` には含めません
- 選択肢を増やす場合は `id` が他と重複しないようにしてください
- 価格を変えたら `RICE_PRODUCT_META.updatedOn` も更新してください
- 期待値を持つテスト `src/lib/__tests__/rice.test.ts` も合わせて更新してください

### 寸法が分かっている場合

箱の寸法まで分かっている荷物は、`src/lib/fare.ts` の `quoteShipping`（寸法モード）で
3 辺合計と重量の大きい方を採用して判定できます。現在の画面ではお米の量からの判定
（`quoteRiceShipping`）のみを使っていますが、ロジックとテストは残してあります。

## 料金データの公式出典

| 種類 | URL |
| --- | --- |
| 運賃一覧表 | https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html |
| サイズ規格 | https://www.kuronekoyamato.co.jp/ytc/customer/send/search/payment/size/ |

## 現在の料金データ

- **適用開始日：2025 年 10 月 1 日**（2025 年 10 月 1 日実施の届出運賃改定）
- **確認日：2026 年 9 月 1 日**
- 種別：宅急便 発払い・現金でのお支払いの基本運賃（税込）
- 収録範囲：**関東発**の 1 行のみ（発送元が栃木県下野市＝関東地帯に固定のため）
- 対応地域：全 47 都道府県（沖縄県を含む）

## 料金データの更新方法

料金改定時に触るファイルは **`src/data/fare-table.ts` の 2 か所だけ**です。
ほかのファイル（UI・計算ロジック）は変更不要です。

### 手順

1. 公式の
   [宅急便運賃一覧表：全国一覧（現金でのお支払い）](https://www.kuronekoyamato.co.jp/ytc/search/estimate/ichiran.html)
   を開き、**「関東発」**の行を確認する
2. `src/data/fare-table.ts` の `KANTO_ORIGIN` の数値を、着地ごとに書き換える
3. 同ファイルの `FARE_TABLE_META` の `effectiveFrom`（適用開始日）と
   `checkedOn`（確認日）を更新する
4. `src/lib/__tests__/fare.test.ts` の `OFFICIAL_KANTO_ORIGIN_FARES`
   （栃木県・東京都・北海道・大阪府・福岡県・沖縄県の期待値）を新運賃に更新する
5. `npm run test && npm run lint && npm run typecheck && npm run build` を実行する

### 具体例

たとえば「関東発・北海道宛て・80 サイズ」が 1,740 円から 1,800 円に改定された場合：

```diff
 const KANTO_ORIGIN: Readonly<Partial<Record<RegionCode, FareRow>>> = {
-  hokkaido: { 60: 1460, 80: 1740, 100: 2050, 120: 2610, 140: 3250, 160: 3630, 180: 5220, 200: 6540 },
+  hokkaido: { 60: 1460, 80: 1800, 100: 2050, 120: 2610, 140: 3250, 160: 3630, 180: 5220, 200: 6540 },
```

```diff
 export const FARE_TABLE_META: FareTableMeta = {
-  effectiveFrom: "2025-10-01",
-  checkedOn: "2026-09-01",
+  effectiveFrom: "2027-04-01",
+  checkedOn: "2027-03-20",
```

```diff
 const OFFICIAL_KANTO_ORIGIN_FARES = {
-  北海道: { 60: 1460, 80: 1740, 100: 2050, ... },
+  北海道: { 60: 1460, 80: 1800, 100: 2050, ... },
```

### 発送元を関東以外にも広げたい場合

`src/data/fare-table.ts` の `FARE_TABLE` に、公式の運賃一覧表から該当する発地の行を
転記して追加してください（`kanto` と同じ形式）。**推測値は絶対に入れないでください。**
料金データが未登録の組み合わせは、金額を出さずに「料金データ未設定」と表示されます。

## 対応していないサービス・条件

このサイトが計算するのは「宅急便（発払い・現金でのお支払い）の基本運賃」だけです。
以下は**計算に含まれていません**。

- 持込割（営業所・取扱店・コンビニへの持ち込み）
- クロネコメンバー割などの会員割引、複数口減額
- キャッシュレス決済運賃（現金以外の支払い）
- クール宅急便、宅急便コンパクト、ネコポス、EAZY などの別サービス
- 着払い、往復宅急便、ゴルフ・スキー宅急便、空港宅急便
- 離島・一部地域の追加条件、時間帯指定等のオプション

規格外（3 辺合計 200cm 超、重量 30kg 超、1 辺 170cm 超）の荷物は、送料を表示せず
「宅急便の規格外」と表示します。また、上下逆さまにできないなど輸送状態に定めがある
お荷物は 1 辺 100cm 以内という制限があり、その旨を画面に表示しています。

## 個人情報を保存しない設計

- 送料計算はすべてブラウザ内（クライアントサイド）の純粋関数で完結します
- 入力された住所を localStorage・Cookie・サーバー・分析サービスへ保存しません
- 住所を `console.log` などに出力しません
- 広告、アクセス解析、トラッキングは実装していません
- 自由入力の住所は React のテキストノードとして描画し、`dangerouslySetInnerHTML` は
  使用していません
- 外部通信は、利用者が「住所を自動入力」を押したときに
  [zipcloud 郵便番号検索 API](https://zipcloud.ibsnet.co.jp/doc/api) へ
  **郵便番号 7 桁のみ**を送信する場合に限られます。町名・番地・建物名は送信しません。
  API キーは不要で、失敗・タイムアウト時は都道府県を手動で選択できます
  （タイムアウトは 6 秒）
- ヤマト運輸には一般公開された送料計算 API が明記されていないため、**API 連携は
  行っていません**。運賃は本リポジトリ内の静的データから引いています（自動
  スクレイピングもしていません）

## ファイル構成（主要部分）

```
src/
├─ data/
│  ├─ fare-table.ts    # 最新運賃データ + メタ情報（運賃改定時はここを更新）
│  ├─ rice-products.ts # お米の選択肢と価格（フォーム変更時はここを更新）
│  ├─ prefectures.ts   # 都道府県 × 配送地域（地帯）の対応データ
│  └─ origin.ts        # 発送元（栃木県下野市・関東発）の固定値
├─ lib/
│  ├─ size.ts          # 荷物サイズ判定（寸法／重量、純粋関数）
│  ├─ fare.ts          # 送料計算（純粋関数）
│  ├─ validation.ts    # 入力バリデーション（純粋関数）
│  ├─ format.ts        # 金額・日付の表示整形
│  ├─ postal.ts        # 郵便番号 → 住所の補完
│  └─ __tests__/       # Vitest のテスト
├─ components/         # UI コンポーネント
└─ app/                # App Router（layout / page / icon）
```

## 免責事項

- 表示される送料は、公開されている基本運賃をもとにした**目安**であり、確定料金では
  ありません。実際の料金は、ヤマト運輸でお荷物を計測した際に確定します。
- サイズ区分は「箱込み」の重量から判定しているため、箱が大きい場合は 1 つ上の
  サイズ区分になり、送料が上がることがあります。
- お米の代金は注文フォームの金額を転記したものです。最新の価格は注文フォームを
  ご確認ください。
- 料金改定・サービス変更により、本サイトのデータが最新でない可能性があります。
  必ずヤマト運輸公式サイトで最新情報をご確認ください。
- 本サイトの利用によって生じたいかなる損害についても、作成者は責任を負いません。
- 本サイトはヤマト運輸株式会社と一切関係のない非公式ツールです。

## ライセンス

このディレクトリのコードは、リポジトリ直下の `LICENSE` に従います。
