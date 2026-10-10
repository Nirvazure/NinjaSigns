# 本地忍术目录与结印资料

整理日期：2026-10-10。共 28 条忍术，新增 25 条。业务数据见 app/domain/jutsu-data.ts。

来源主要为 Narutopedia 的结印和参考文献索引，漫画/动画位置为首次登场，资料书页码为条目参考。范围为火影忍者漫画与原篇、疾风传动画，排除博人传、剧场版、游戏及同人。

资料书简称：临之书（Rin）、斗之书（Tō）、者之书（Sha）、阵之书（Jin / Fourth Databook）、兵之书（Hyō）。

## 十二基础印映射

| 中文印名 | 动物名 | 本地 SealId |
| -------- | ------ | ----------- |
| 子       | 鼠     | `rat`       |
| 丑       | 牛     | `ox`        |
| 寅       | 虎     | `tiger`     |
| 卯       | 兔     | `hare`      |
| 辰       | 龙     | `dragon`    |
| 巳       | 蛇     | `snake`     |
| 午       | 马     | `horse`     |
| 未       | 羊     | `ram`       |
| 申       | 猴     | `monkey`    |
| 酉       | 鸟     | `bird`      |
| 戌       | 犬     | `dog`       |
| 亥       | 猪     | `boar`      |

基础印与特殊手势说明见 [Hand Seal](https://naruto.fandom.com/wiki/Hand_Seal)。表内使用地支名称，避免动物名与地支混写。

## 正式目录

| 本地 ID                    | 忍术与资料索引                                                                            | 本地采用的结印顺序                    | 漫画首次登场              | 动画首次登场  | 资料书参考页     |
| -------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------- | ------------- | ---------------- |
| `summoning`                | [通灵之术](https://naruto.fandom.com/wiki/Summoning_Technique)                            | 亥 → 戌 → 酉 → 申 → 未                | 29 话；结印参考 92 话 p18 | 原篇 17 集    | 临 p182；兵 p163 |
| `fireball`                 | [豪火球之术](https://naruto.fandom.com/wiki/Fire_Release%3A_Great_Fireball_Technique)     | 巳 → 未 → 申 → 亥 → 午 → 寅           | 7 话                      | 原篇 5 集     | 临 p174          |
| `chidori`                  | [千鸟](https://naruto.fandom.com/wiki/Chidori)                                            | 丑 → 卯 → 申                          | 113 话                    | 原篇 67 集    | 临 p209          |
| `body-flicker`             | [瞬身术](https://naruto.fandom.com/wiki/Body_Flicker_Technique)                           | 寅                                    | 1 话                      | 原篇 1 集     | 临 p197          |
| `body-replacement`         | [替身术](https://naruto.fandom.com/wiki/Body_Replacement_Technique)                       | 寅 → 亥 → 丑 → 戌 → 巳                | 5 话                      | 原篇 3 集     | 临 p177          |
| `shuriken-shadow-clone`    | [手里剑影分身之术](https://naruto.fandom.com/wiki/Shuriken_Shadow_Clone_Technique)        | 丑 → 戌 → 辰 → 子 → 戌 → 亥 → 巳 → 寅 | 117 话                    | 原篇 69 集    | 临 p196；兵 p163 |
| `shadow-sewing`            | [影缝术](https://naruto.fandom.com/wiki/Shadow_Sewing_Technique)                          | 子 → 酉                               | 283 话                    | 疾风传 34 集  | 者 p231          |
| `mind-clone-switch`        | [心转分身之术](https://naruto.fandom.com/wiki/Mind_Clone_Switch_Technique)                | 巳 → 丑 → 寅 → 未                     | 534 话                    | 疾风传 274 集 | 条目未列页码     |
| `phoenix-sage-fire`        | [凤仙火之术](https://naruto.fandom.com/wiki/Fire_Release%3A_Phoenix_Sage_Fire_Technique)  | 子 → 寅 → 戌 → 丑 → 卯 → 寅           | 46 话                     | 原篇 28 集    | 临 p174          |
| `dragon-fire`              | [龙火之术](https://naruto.fandom.com/wiki/Fire_Release%3A_Dragon_Fire_Technique)          | 巳 → 辰 → 卯 → 寅                     | 49 话                     | 原篇 30 集    | 临 p175          |
| `fire-dragon-flame-bullet` | [火龙炎弹](https://naruto.fandom.com/wiki/Fire_Release%3A_Fire_Dragon_Flame_Bullet)       | 未 → 午 → 巳 → 辰 → 子 → 丑 → 寅      | 120 话                    | 原篇 71 集    | 斗 p205          |
| `ash-pile-burning`         | [灰积烧](https://naruto.fandom.com/wiki/Fire_Release%3A_Ash_Pile_Burning)                 | 巳 → 子 → 巳 → 寅                     | 323 话                    | 疾风传 77 集  | 者 p237          |
| `great-dragon-fire`        | [豪龙火之术](https://naruto.fandom.com/wiki/Fire_Release%3A_Great_Dragon_Fire_Technique)  | 寅                                    | 390 话                    | 疾风传 137 集 | 者 p235          |
| `intelligent-hard-work`    | [头刻苦](https://naruto.fandom.com/wiki/Fire_Release%3A_Intelligent_Hard_Work)            | 子 → 戌 → 寅                          | 335 话                    | 疾风传 84 集  | 者 p236          |
| `great-fire-annihilation`  | [豪火灭却](https://naruto.fandom.com/wiki/Fire_Release%3A_Great_Fire_Annihilation)        | 午                                    | 560 话                    | 疾风传 322 集 | 阵 p239          |
| `great-fire-destruction`   | [豪火灭失](https://naruto.fandom.com/wiki/Fire_Release%3A_Great_Fire_Destruction)         | 子 → 丑 → 戌 → 午 → 申 → 亥 → 寅      | 575 话                    | 疾风传 332 集 | 阵 p316          |
| `great-breakthrough`       | [大突破](https://naruto.fandom.com/wiki/Wind_Release%3A_Great_Breakthrough)               | 寅 → 丑 → 戌 → 卯 → 巳                | 46 话                     | 原篇 28 集    | 临 p219          |
| `vacuum-sphere`            | [真空玉](https://naruto.fandom.com/wiki/Wind_Release%3A_Vacuum_Sphere)                    | 子 → 卯 → 戌                          | 477 话                    | 疾风传 209 集 | 阵 p288          |
| `vacuum-great-sphere`      | [真空大玉](https://naruto.fandom.com/wiki/Wind_Release%3A_Vacuum_Great_Sphere)            | 寅 → 戌                               | 479 话                    | 疾风传 210 集 | 阵 p288          |
| `vacuum-wave`              | [真空波](https://naruto.fandom.com/wiki/Wind_Release%3A_Vacuum_Wave)                      | 子 → 巳 → 午 → 戌                     | 456 话                    | 疾风传 199 集 | 阵 p289          |
| `vacuum-serial-waves`      | [真空连波](https://naruto.fandom.com/wiki/Wind_Release%3A_Vacuum_Serial_Waves)            | 子 → 巳 → 午 → 巳 → 戌                | 479 话                    | 疾风传 210 集 | 阵 p289          |
| `wind-cutter`              | [风切之术](https://naruto.fandom.com/wiki/Wind_Release%3A_Wind_Cutter_Technique)          | 寅 → 卯 → 戌 → 未 → 辰                | 425 话                    | 疾风传 160 集 | 阵 p325          |
| `wild-water-wave`          | [水乱波](https://naruto.fandom.com/wiki/Water_Release%3A_Wild_Water_Wave)                 | 辰 → 寅 → 卯                          | 373 话                    | 疾风传 128 集 | 者 p273          |
| `water-bullet`             | [水弹之术](https://naruto.fandom.com/wiki/Water_Release%3A_Water_Bullet_Technique)        | 寅 → 丑 → 寅 → 子                     | 612 话                    | 疾风传 363 集 | 阵 p320          |
| `added-weight-rock`        | [加重岩之术](https://naruto.fandom.com/wiki/Earth_Release%3A_Added-Weight_Rock_Technique) | 巳                                    | 466 话                    | 疾风传 204 集 | 阵 p274          |
| `dropping-lid`             | [落盖之术](https://naruto.fandom.com/wiki/Earth_Release%3A_Dropping_Lid)                  | 巳                                    | 425 话                    | 疾风传 160 集 | 阵 p323          |
| `false-darkness`           | [伪暗](https://naruto.fandom.com/wiki/Lightning_Release%3A_False_Darkness)                | 巳                                    | 334 话                    | 疾风传 84 集  | 者 p312          |
| `black-panther`            | [黑斑差](https://naruto.fandom.com/wiki/Lightning_Release%3A_Black_Panther)               | 未                                    | 526 话                    | 疾风传 268 集 | 阵 p304          |

## 版本备注

- 火龙炎弹采用七印：未 → 午 → 巳 → 辰 → 子 → 丑 → 寅。
- 千鸟保留丑 → 卯 → 申的短序列；[资料另列长版本](https://naruto.neoseeker.com/wiki/Chidori)：申 → 辰 → 子 → 酉 → 丑 → 巳 → 戌 → 寅 → 申。
- 豪火灭失采用七印版本，动画还存在寅印简化版本。
- 通灵只训练五个手印，施术动作不纳入识别。

## 本批次未收录

水龙弹的[官方说明](https://naruto-official.com/en/news/01_2619)列出动画 44 印，含模型不支持的壬印。影分身十字印、水鲛弹特殊印、合掌等动作暂不收录。水阵壁与土流壁留待后续整理。

新增忍术使用已有 paper.svg 和默认颜色，effect 为 null；来源与展示配置不混入业务记录。本次不涉及数据库。
