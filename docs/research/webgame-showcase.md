# Three.js / Babylon.js 製の有名ゲーム・インタラクティブ作品 事例集

LT「Web 技術でもこれだけのものが作れる」用の裏取り済み事例リスト。
調査日: 2026-09-20

**裏取りの方針**
- 各項目に「使用技術の根拠 URL」を必ず付けた。
- ★印は **実際に配信中の JS バンドルを取得して `THREE.*` / `BABYLON.*` のシンボルを直接確認した**もの（最も確度が高い）。
- 確証が取れなかったものは末尾の「未確認」枠に隔離した。

---

## 1. Three.js 製のゲーム（商用・知名度優先）

| 作品名 | URL | 何なのか | 技術の根拠（URL / 記述内容の要約） | 知名度の手がかり |
|---|---|---|---|---|
| **Krunker.io** | https://krunker.io/ | ブラウザで即遊べる無料マルチプレイ FPS。低スペック PC でも動く軽量設計 | ①[WebGL 総本山](https://webgl.souhonzan.org/entry/?v=1467)「three.js 製でサクサク動作するオンライン FPS」として紹介 ②[ioground: The history behind Krunker.io](https://ioground.com/blog/the-history-behind-krunker-io) — 3D エンジンに Three.js を採用したため低スペックマシンでも動作した、と記述 ③[three.js 公式ショーケース](https://threejs.org/)に掲載 | 累計 **2 億ユニークプレイヤー**超。2022 年に FRVR が買収（[GamesBeat](https://gamesbeat.com/frvr-acquires-free-to-play-shooter-krunker-io/)）。開発は Sidney de Vries (2018〜) |
| **Crossy Road（Web 版 / Poki）** | https://poki.com/en/g/crossy-road | スマホで大ヒットした横断アクションのブラウザ移植版 | [three.js 公式フォーラム "Crossy Road - Web version"](https://discourse.threejs.org/t/crossy-road-web-version/8554) — Poki が開発元 Hipster Whale と組み three.js で Web 版を制作、デスクトップ／モバイル両対応と明記。three.js 公式ショーケースにも掲載 | 同スレッドで **4,000 万プレイ超、「おそらく最もプレイされた three.js 製ゲーム」** と言及。Poki で 170 万 upvote 超 |
| **PolyTrack** | https://www.kodub.com/apps/polytrack / https://poki.com/en/g/polytrack | Trackmania 系のローポリ・タイムアタック レーサー。トラックエディタ + 世界ランキング付き | [three.js 公式ショーケース](https://threejs.org/)に "Kodub Polytrack" として掲載。描画 Three.js + 物理 Bullet の構成が各紹介記事で共通して記載 | Poki / CrazyGames / itch.io に同時配信。itch.io の "made with threejs" タグで常時上位 |
| **Slow Roads** | https://slowroads.io/ | 無限に生成される風景をひたすらドライブする「癒し系」運転ゲーム | [three.js 公式ショーケース](https://threejs.org/)に掲載。開発者 (Anslo / topograph) 自身が「プロシージャル地形生成と JS での 3D アプリ開発の限界を探る実験」として Three.js + WebGL で 2022 年 10 月公開と説明 | Hacker News・Reddit で大きく拡散。itch.io でデスクトップ版も配布 |
| **HexGL** | https://hexgl.bkcore.com/ | F-Zero / WipEout 系の高速ホバーレーサー。WebGL 黎明期の代表作 | [GitHub: BKcore/HexGL](https://github.com/BKcore/HexGL) — 公式 README に「HTML5, JavaScript, **three.js** で作られた」と明記。MIT ライセンスで全ソース公開 | 2012 年公開。three.js 公式ショーケースに長年掲載され、WebGL ゲームの定番デモとして引用され続けている |
| **Moon Rider** | https://moonrider.xyz/ | Beat Saber ライクな WebXR リズムゲーム。ブラウザだけで VR ヘッドセット対応 | [GitHub: supermedium/moonrider](https://github.com/supermedium/moonrider) — A-Frame 製と明記。A-Frame は [Wikipedia](https://en.wikipedia.org/wiki/A-Frame_(software)) の通り three.js の上に構築されたフレームワーク | Supermedium の 2 人が数ヶ月で制作した WebXR デモとして有名。BeatSaver の譜面をそのまま読み込める。Quest 含む全ブラウザ/ヘッドセット対応 |
| **three-quake / three-doom / three-descent** | https://mrdoob.github.io/three-quake/ ほか | Quake・DOOM・Descent のレベルを three.js で動かす移植デモ | three.js 作者 **mrdoob 本人の GitHub リポジトリ**で公開され、[three.js 公式ショーケース](https://threejs.org/)のトップに掲載 | 作者本人の作品という点が強い。LT で「あの Quake がブラウザで」と見せやすい |

---

## 2. Three.js 製の有名インタラクティブ作品・技術デモ

| 作品名 | URL | 何なのか | 技術の根拠（URL / 記述内容の要約） | 知名度の手がかり |
|---|---|---|---|---|
| ★ **NASA Eyes on the Solar System** | https://eyes.nasa.gov/apps/solar-system/ | NASA の実データで太陽系と 150 以上のミッションを 3D で探索できる公式ビジュアライザ | **実ソース確認**: `https://eyes.nasa.gov/apps/solar-system/vendors.js` に `THREE.WebGLRenderer` / `THREE.GLTFLoader` / `THREE.BatchedMesh` 等のシンボルが多数含まれる。加えて [three.js 公式ショーケース](https://threejs.org/)に掲載 | NASA/JPL の公式サイト。[JPL のリリース](https://www.jpl.nasa.gov/news/explore-the-solar-system-with-nasas-new-and-improved-3d-eyes/)によると 2022 年 9 月に 2 年以上かけた刷新版を公開。姉妹アプリ Eyes on Mars 2020 も同showcase掲載 |
| ★ **SpaceX ISS Docking Simulator** | https://iss-sim.spacex.com/ | Crew Dragon を手動操縦して ISS にドッキングさせる公式シミュレータ | **実ソース確認**: トップページの `<script>` に `js/three/three.min.js`, `js/three/GLTFLoader.js`, `js/three/CSS2DRenderer.js` を直接読み込んでいる。three.js 公式ショーケースにも掲載 | SpaceX 公式。2020 年の Crew Dragon 有人飛行に合わせて公開され世界的に話題化。GitHub に自動操縦 bot を作るリポジトリが多数生まれた |
| **ROME "3 Dreams of Black"** | https://rome.mrdoob.com/ | Chris Milk 監督のインタラクティブ・ミュージックフィルム。WebGL の存在を世に知らしめた歴史的作品 | [Google Developers Blog "Dreams in 3D: a WebGL experience for the modern browser"](https://developers.googleblog.com/dreams-in-3d-a-webgl-experience-for-the-modern-browser/) — **three.js が backbone の大半を担っている**と明記。[rome.mrdoob.com/tech](https://rome.mrdoob.com/tech/) で 8 つの WebGL デモと three.js ライブラリを全公開 | 2011 年の Google Chrome Experiment。Danger Mouse & Daniele Luppi (feat. Jack White / Norah Jones) の楽曲。Chrome チームが公式に技術解説動画を公開 |
| **Bruno Simon ポートフォリオ** | https://bruno-simon.com/ | 車を運転して回るプレイアブルな 3D ポートフォリオサイト | [Awwwards ケーススタディ](https://www.awwwards.com/brunos-portfolio-case-study.html) / [本人の Medium](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b) — Three.js + Cannon.js（物理）で制作と本人が解説。three.js 公式ショーケース掲載 | **Awwwards Site of the Year 2020** 受賞、Site of the Month も受賞。Creative Bloq 等で多数紹介。作者は Three.js Journey の講師 |
| **Google Interland (Be Internet Awesome)** | https://beinternetawesome.withgoogle.com/interland | Google の子ども向けネットリテラシー教育ゲーム | [14islands の制作実績ページ](https://www.14islands.com/work/interland) — Three.js / Blender / GreenSock / WebGL で構築、古いスマホでも滑らかに動くと明記（14islands と North Kingdom が技術パートナー）。three.js 公式ショーケース掲載 | **Google 公式プロダクト**。12 言語にローカライズ、複数の広告賞を受賞 |
| **Lusion（スタジオ／実験作品群）** | https://lusion.co/ | Awwwards 常連のクリエイティブスタジオ。WebXR Sneakers、Infinite Passerella などの実験作を多数公開 | [three.js 公式ショーケース](https://threejs.org/)に本サイトと個別実験（exp-gemini, exp-infinite-passerella, webxr-sneakers 等）が多数掲載 | Awwwards の Site of the Year / Developer Award 常連。ハイエンド WebGL 表現の代表格 |
| **大手ブランドの three.js サイト群** | 例: [Cartier "The Fabulous Cartier Journey"](https://www.cartier.com/thefabulouscartierjourney), [Gucci 1955 Horsebit](https://1955horsebit.gucci.com/), [Shopify Editions](https://www.shopify.com/editions/winter2026) | ラグジュアリーブランド／大手 SaaS のキャンペーンサイト | いずれも[three.js 公式ショーケース](https://threejs.org/)に掲載（＝公式が three.js 製として紹介） | Cartier・Gucci・Shopify というブランド名そのものが説得力。※個別の技術記事までは確認できていないため、根拠は「公式ショーケース掲載」のみ |

---

## 3. 日本の事例（すべて Three.js 系）

| 作品名 | URL | 何なのか | 技術の根拠（URL / 記述内容の要約） | 知名度の手がかり |
|---|---|---|---|---|
| ★ **映画『PERFECT DAYS』公式サイト** | https://www.perfectdays-movie.jp/ | ヴィム・ヴェンダース監督 × 役所広司の映画公式サイト。3D 表現を全面に使用 | **実ソース確認**: `/assets/202408271335/js/main.js` に `THREE.WebGLRenderer` / `THREE.BufferGeometry` / `THREE.KeyframeTrack` 等が多数含まれる。[three.js 公式ショーケース](https://threejs.org/)にも掲載 | 役所広司がカンヌ国際映画祭 **男優賞**受賞、アカデミー賞国際長編映画賞ノミネート作品の公式サイト |
| ★ **KOKUYO「Curiosity is LIFE」** | https://kokuyo.com/special/curiosity-is-life/ | コクヨのブランドサイト。3D インタラクティブなコーポレートメッセージ | **実ソース確認**: `/sites/default/files/special/curiosity-is-life/assets/js/cil.js` に `THREE.GLTFLoader` / `THREE.KTX2Loader` / `THREE.Texture` 等、および `three.js` 文字列が含まれる。three.js 公式ショーケース掲載 | 日本の大手文具・オフィス家具メーカーのブランドサイト |
| **pixiv three-vrm / VRoid Hub** | https://vroid.com/hub / https://github.com/pixiv/three-vrm | VRM 形式の 3D アバターをブラウザ上で表示・アニメーションさせるライブラリと、それを使ったアバター投稿プラットフォーム | [ピクシブ公式プレスリリース](https://www.pixiv.co.jp/news/press-release/article/7361/) — 「three.js（Web 上の 3DCG を簡単に扱える JS ライブラリ）の上に構築」「VRoid Hub で活用された技術をオープンソース化」と明記 | ピクシブ公式プロダクト。VRM のデファクト標準 Web 実装で、ChatVRM など多数の派生プロダクトの基盤 |
| **日本の制作会社／企業サイト群** | [Junni](https://junni.co.jp/), [homunculus](http://homunculus.jp/), [Garden Eight](https://garden-eight.com/), [クボタ FutureCube](https://www.kubota.com/futurecube/), [大丸松坂屋](https://www.daimaru-matsuzakaya.com/vi/), [POLA 母の日](https://www.pola.co.jp/wecaremore/mothersday/), [田尾太次真](http://taotajima.jp/) | 日本の Web 制作会社・企業キャンペーンサイト | すべて[three.js 公式ショーケース](https://threejs.org/)に掲載。日本の事例が公式に多数並んでいること自体が「日本でも普通に使われている」根拠になる | 日本の WebGL 表現を牽引してきた制作会社が並ぶ。国内 WebGL まとめ記事でも定番（例: [AndHA](https://and-ha.com/coding/webgl_summary/)） |

---

## 4. Babylon.js 製のゲーム

| 作品名 | URL | 何なのか | 技術の根拠（URL / 記述内容の要約） | 知名度の手がかり |
|---|---|---|---|---|
| **Minecraft Classic** | https://classic.minecraft.net/ | Mojang 公式の Minecraft 10 周年記念ブラウザ版（Classic 0.0.23a_01 の JS リメイク） | ①[Babylon.js 公式 Games ページ](https://www.babylonjs.com/games/)に Mojang 制作として掲載 ②[Babylon.js 公式 Medium "Minecraft Classic: A Truly OPEN Story"](https://babylonjs.medium.com/minecraft-classic-a-truly-open-story-85368ffe314b) — Mojang が North Kingdom と組み、OSS でコミュニティが活発な点を理由に Babylon.js を採用したと記述 ③[Minecraft Wiki](https://minecraft.wiki/w/Minecraft_Classic_(JavaScript_remake)) も Babylon.js 製と記載（基盤は Babylon.js 上の noa ボクセルエンジン） | **Mojang / Microsoft 公式**。世界で最も売れたゲームの公式ブラウザ版。LT でのインパクト最大級 |
| **Shell Shockers (shellshock.io)** | https://shellshock.io/ | 卵がライフル担いで撃ち合う本格マルチプレイ FPS。Web 版 .io ゲームの代表格 | ①[Wikipedia: Shell Shockers](https://en.wikipedia.org/wiki/Shell_Shockers) — 「Babylon.js エンジンを使って制作された」と明記 ②[Babylon.js 公式 Games ページ](https://www.babylonjs.com/games/)に Fun Fetched 制作として掲載 ③[Babylon.js フォーラムのディープダイブ記事](https://forum.babylonjs.com/t/deep-dive-shell-shockers-multi-million-web-game-success/37927) | 2017 年公開。**2025 年時点で累計 2 億プレイヤー超**（2019 年時点で 4,000 万）。開発は Blue Wizard Digital。CrazyGames だけで 3,500 万プレイ超 |
| **Temple Run 2（Web 版 / Poki）** | https://poki.com/en/g/temple-run-2 | スマホで 10 億 DL 級の無限ランナーのブラウザ移植版 | ①[Babylon.js 公式 Games ページ](https://www.babylonjs.com/games/)に Imangi Studios 制作として掲載 ②[Babylon.js 公式 X (@babylonjs) の投稿](https://x.com/babylonjs/status/1907115868661682384) — `#BuiltWithBabylon` として「Temple Run 2 が Web で完璧に動く」と紹介 | Imangi Studios の代表作。2020 年 11 月に Poki で Web 版公開。Poki に派生タイトル（Frozen Shadows, Jungle Fall 等）も多数 |
| **Space Truckers** | https://github.com/jelster/space-truckers | 「宇宙で荷物を A 地点から B 地点へ運ぶ」ゲーム。Babylon.js 公式コミュニティゲーム | [Babylon.js 公式 Games ページ](https://www.babylonjs.com/games/)掲載。[GitHub](https://github.com/jelster/space-truckers) に「Babylon.js の WebGL/WebGPU フレームワークを Web アプリに統合する要点を示す OSS プロジェクト」と明記 | Packt の書籍『Going the Distance with Babylon.js』の題材として丸ごと使われている（学習用リファレンス実装） |
| **Tunnel Rush** | https://poki.com/en/g/tunnel-rush | 高速でトンネルを駆け抜ける反射神経ゲーム | [Babylon.js 公式コミュニティページ](https://www.babylonjs.com/community/)に Deer Cat 制作として掲載 | Poki の定番タイトル。※根拠は公式ショーケース掲載のみ |

---

## 5. Babylon.js 製の有名デモ・企業案件

| 作品名 | URL | 何なのか | 技術の根拠（URL / 記述内容の要約） | 知名度の手がかり |
|---|---|---|---|---|
| **Assassin's Creed Pirates（WebGL 版）** | 紹介: https://thenextweb.com/news/microsoft-ubisoft-launch-3d-web-game-assassins-creed-pirates-built-open-source-framework-babylon-js | Ubisoft のモバイル版を元にした、ブラウザで動く海戦アクションデモ（2014） | ①[The Next Web](https://thenextweb.com/news/microsoft-ubisoft-launch-3d-web-game-assassins-creed-pirates-built-open-source-framework-babylon-js) ②[Game Developer](https://www.gamedeveloper.com/business/ubisoft-microsoft-partner-to-launch-i-assassin-s-creed-i-html5-demo) ③[Wikipedia: Babylon.js](https://en.wikipedia.org/wiki/Babylon.js) — いずれも「Ubisoft が Babylon.js（Microsoft 製 OSS の HTML5/WebGL 3D エンジン）で構築した Web デモ」と記述 | **Babylon.js で作られた最初の Web ゲーム**であり、Ubisoft × Microsoft の共同案件。わずか 4 人・任意の解像度/デバイス対応という点が当時大きく報じられた。歴史的な「大手 IP が Web に来た」事例 |
| **Xbox Design Lab** | https://xboxdesignlab.xbox.com/ | Xbox コントローラーを色・パーツ単位でカスタムできる公式 3D コンフィギュレータ（実購入可能） | ①[Babylon.js 公式 E-commerce ページ](https://www.babylonjs.com/ecommerce/)に Xbox.com の事例として掲載 ②[Babylon.js フォーラム "Xbox Design lab cool new transparent effects powered by BabylonJS"](https://forum.babylonjs.com/t/xbox-design-lab-cool-new-transparent-effects-powered-by-babylonjs/53710) — 透明コントローラーの屈折/ブラー表現に Babylon.js の Render Target Texture を使用と記述 | **Microsoft 公式の商用 EC**。27 カ国展開。実際に金を払って買える 3D コンフィギュレータという点が強い |
| **IBM Mayflower Autonomous Ship** | https://www.ibm.com/resources/cloud/mayflower-ship-experience/ | IBM + ProMare の完全自律航行船を紹介するインタラクティブ 3D 体験サイト | [開発者 Joe Pavitt (IBM) の技術記事](https://joepavitt.medium.com/building-the-web-based-3d-digital-experience-for-the-mayflower-autonomous-ship-a56f08e6558) — 技術スタックは Vue + **BabylonJS** + d3.js と明記。[続編記事](https://joepavitt.medium.com/optimizing-a-large-scale-babylon-js-scene-9466bb715e15)では 600 メッシュ / 100 万頂点の港シーンを 45FPS 維持した最適化を解説 | **IBM 公式**。大西洋横断の自律航行という実プロジェクトの公式サイト。「大規模シーンでも実用 FPS が出る」証拠として技術的に引用しやすい |
| **Adobe Dimension Web Viewer（3D Publish）** | https://helpx.adobe.com/dimension/using/publish-3d-scene.html | Dimension で作った 3D シーンを URL 1 本で誰でもブラウザ閲覧できる公式ビューア | ①[Babylon.js 公式コミュニティページ](https://www.babylonjs.com/community/)に Adobe 事例として掲載 ②[Adobe 公式ブログ "Behind the Scenes with Adobe Dimension Engineers: How We Built the 3D Publish Feature"](https://theblog.adobe.com/behind-the-scenes-with-adobe-dimension-engineers-how-we-built-the-3d-publish-feature/) — Web ビューアの構築過程（ライティング/透過/カメラ）を解説、Babylon.js ベースで glTF/GLB を表示 | **Adobe 公式製品の一機能**。Khronos も glTF 事例として[紹介](https://www.khronos.org/news/permalink/publishing-to-the-web-using-gltf-from-the-new-adobe-dimension-2.0) |
| **大手 EC の 3D コンフィギュレータ群** | [Babylon.js E-commerce ショーケース](https://www.babylonjs.com/ecommerce/) | Van Cleef & Arpels（リング）、Puma（アパレル）、Ferrari SF90 Stradale、IWC Schaffhausen（時計）、Nike By You、Jeep（Wrangler ビルダー）、Wayfair Room Planner 3D、Target ルームプランナー、Lowe's Deck Designer、Stanley（タンブラー） | [Babylon.js 公式 E-commerce ページ](https://www.babylonjs.com/ecommerce/)が、これらをすべて Babylon.js 採用事例として一覧掲載 | ブランド名の並びだけでスライド 1 枚が成立する。「Web 3D はもう EC の本番環境で回っている」という主張の裏付けに最適 |
| **SharePoint Spaces / Volkswagen ID. Buzz Configurator / JigSpace ほか** | [Babylon.js 公式コミュニティページ](https://www.babylonjs.com/community/) | Microsoft の 3D 空間 SharePoint、VW の EV バン配色コンフィギュレータ、AR プレゼンツール JigSpace など | [Babylon.js 公式コミュニティページ](https://www.babylonjs.com/community/)に企業名付きで掲載 | Microsoft / Volkswagen(Wrapmate) / JigSpace。※根拠は公式ショーケース掲載のみ |

---

## 6. 未確認（＝スライドに載せるなら要追加調査）

| 作品名 | 何なのか | 状況 |
|---|---|---|
| Masters.com（US Masters ゴルフ） | オーガスタ・ナショナルの 3D コースビュー | Babylon.js 公式コミュニティページには掲載されているが、Masters 側・開発側の技術記述が見つからず。ページの JS はバンドル化されておりシンボル確認もできなかった |
| Wayfair Room Planner 3D / Target ルームプランナー | 家具配置の 3D プランナー | Babylon.js 公式 EC ページ掲載のみ。直接のソース確認はボット対策で取得不可 |
| RAF Red Arrows / D&D Beyond Digital Dice | 英空軍アクロバットチームの 3D サイト / TRPG のダイスロール演出 | Babylon.js 公式コミュニティページ掲載のみ。一次情報未確認 |
| Shopify Editions / Gucci 1955 Horsebit / Cartier | 大手ブランドのキャンペーンサイト | three.js 公式ショーケース掲載のみ。バンドルが難読化されておりシンボル確認不可 |
| Sidus Heroes / Morterra | Babylon.js 製とされる Web ゲーム | Babylon.js 公式掲載はあるが、知名度の裏付けデータ（プレイヤー数等）が取れず |
| Jelly Mario | マリオが液状化するミーム的 Web ゲーム | three.js 公式ショーケース掲載はあるが、作者による技術記述を確認できず |

---

## 参考にした公式ショーケース

- [three.js 公式サイト トップページ（Featured projects）](https://threejs.org/) — 約 240 件の採用事例が新しい順に並ぶ。日本の事例も多数
- [Babylon.js 公式 Games](https://www.babylonjs.com/games/)
- [Babylon.js 公式 Community（デモ・企業案件）](https://www.babylonjs.com/community/)
- [Babylon.js 公式 E-commerce（コンフィギュレータ事例）](https://www.babylonjs.com/ecommerce/)
- [itch.io "made with threejs" タグ](https://itch.io/games/made-with-threejs)
