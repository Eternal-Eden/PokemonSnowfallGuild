# 计算器使用说明 / Quick Usage for the Damage Calculator

本文件概述如何使用并配置此宝可梦伤害计算器（simple_calc.py + 数据文件）。

## 快速上手
- 确保以下数据文件在 calc 目录：
  - moves.yaml（招式数据）
  - items_custom.yaml（道具：进攻/防守道具）
  - 进攻特性.yaml / 防守特性.yaml（特性描述 -> 代码化映射）
  - 其它数据文件（pokedex / natures 等，根据项目需要）
- 运行：
  - Windows PowerShell / CMD: `python .\simple_calc.py`
  - 程序会打印计算详情与伤害区间。

## 在代码中设置对战双方（示例）
- 在 main() 中按示例创建 Pokemon 对象：
  - attacker: name, types, level, nature, ability, item, status, weather, screens, ivs, evs
  - defender: name, types, level, nature, ability, item, status, weather, screens, ivs, evs

示例片段见 README / 示例文件（NEW_FEATURES.md 上方的示例）。

## 输出内容（重要）
- 基础能力值：进攻方 Attack / Sp. Attack，防守方 Defense / Sp. Defense，HP（公式计算的最大 HP）。
- 倍率明细（Multipliers）：
  - 属性相克（type effectiveness）: x0.25 / x0.5 / x1 / x2 / x4
  - 其他修正（other modifiers）：包含天气、道具、状态、特性等的乘积（显示浮点值）
  - STAB（属性一致加成）
  - 道具的进攻/防守倍率（单独列出）
- 伤害区间（基于随机因子 0.85~1.00，16 档）：
  - 非暴击与暴击（暴击倍率在显示中以 1.5x 表示）两条区间
  - OHKO 概率（离散 16 档统计）
- 计算步骤（四步）与每步的整数化规则（见下）

## 精确计算与取整规则（严格顺序）
按此严格顺序并在指定步骤做取整：
1. other_modifiers × critical_multiplier → 五舍六入（round half up，取整为整数）
2. × random_factor ∈ [0.85,1.00] → 向下取整（floor）
3. × STAB → 五舍六入（round half up）
4. × type_effectiveness → 向下取整（floor）
- 每步结果用于下一步计算，最终整数乘以 base_damage 得出最终伤害值。

## 特性与道具行为概览
- 特性（进攻/防守）由 YAML 加载并在代码中映射为具体效果：
  - 部分特性（如适应力）直接改变 STAB；如有 HP% 触发类，可按配置决定是否无条件触发或基于 current_hp。
- 道具通过 items_custom.yaml 定义：
  - 可作用于伤害（effect: damage）或作用于数值（stats 翻倍/倍率）
  - 进攻/防守道具分别在 attacker_items / defender_items 下定义

## 可配置项与调试
- 切换 item 文件名：环境变量 POKEMON_ITEMS_FILE（可选，项目目前默认使用 items_custom.yaml）
- 若输出过多或需要简洁，可注释 main() 中的提示块（已提供注释版）
- 若怀疑特性/道具未生效：检查 YAML 名称是否有前后空格，程序会 strip 名称再匹配

## 常见调整建议
- 想更真实（官方）规则：将猛火等 HP% 特性按 current_hp 条件触发（代码里可选择开启/关闭）。
- 想更平滑的随机效果：可改为保留浮点直到最后再取整（但会改变当前的严格步骤结果）。

## 例子与验证
- 若期望结果为“修正 x4.5，伤害 238~280”，请保证：
  - other_modifiers = 1.5 (天气) × 1.5 (猛火) × 2.0 (电气球 effect:damage) = 4.5
  - 使用本计算器的四步取整会给出接近该区间的结果（若 base_damage 与参考工具一致）。

---

如需我把 NEW_FEATURES.md 进一步精简为用户手册页面或添加示例截图/命令行参数说明，我可以直接写入文件。# filepath: c:\Users\lauji\Documents\snow guild software\pokemonsnowfallguild\calc\NEW_FEATURES.md
# 计算器使用说明 / Quick Usage for the Damage Calculator

本文件概述如何使用并配置此宝可梦伤害计算器（simple_calc.py + 数据文件）。

## 快速上手
- 确保以下数据文件在 calc 目录：
  - moves.yaml（招式数据）
  - items_custom.yaml（道具：进攻/防守道具）
  - 进攻特性.yaml / 防守特性.yaml（特性描述 -> 代码化映射）
  - 其它数据文件（pokedex / natures 等，根据项目需要）
- 运行：
  - Windows PowerShell / CMD: `python .\simple_calc.py`
  - 程序会打印计算详情与伤害区间。

## 在代码中设置对战双方（示例）
- 在 main() 中按示例创建 Pokemon 对象：
  - attacker: name, types, level, nature, ability, item, status, weather, screens, ivs, evs
  - defender: name, types, level, nature, ability, item, status, weather, screens, ivs, evs

示例片段见 README / 示例文件（NEW_FEATURES.md 上方的示例）。

## 输出内容（重要）
- 基础能力值：进攻方 Attack / Sp. Attack，防守方 Defense / Sp. Defense，HP（公式计算的最大 HP）。
- 倍率明细（Multipliers）：
  - 属性相克（type effectiveness）: x0.25 / x0.5 / x1 / x2 / x4
  - 其他修正（other modifiers）：包含天气、道具、状态、特性等的乘积（显示浮点值）
  - STAB（属性一致加成）
  - 道具的进攻/防守倍率（单独列出）
- 伤害区间（基于随机因子 0.85~1.00，16 档）：
  - 非暴击与暴击（暴击倍率在显示中以 1.5x 表示）两条区间
  - OHKO 概率（离散 16 档统计）
- 计算步骤（四步）与每步的整数化规则（见下）

## 精确计算与取整规则（严格顺序）
按此严格顺序并在指定步骤做取整：
1. other_modifiers × critical_multiplier → 五舍六入（round half up，取整为整数）
2. × random_factor ∈ [0.85,1.00] → 向下取整（floor）
3. × STAB → 五舍六入（round half up）
4. × type_effectiveness → 向下取整（floor）
- 每步结果用于下一步计算，最终整数乘以 base_damage 得出最终伤害值。

## 特性与道具行为概览
- 特性（进攻/防守）由 YAML 加载并在代码中映射为具体效果：
  - 部分特性（如适应力）直接改变 STAB；如有 HP% 触发类，可按配置决定是否无条件触发或基于 current_hp。
- 道具通过 items_custom.yaml 定义：
  - 可作用于伤害（effect: damage）或作用于数值（stats 翻倍/倍率）
  - 进攻/防守道具分别在 attacker_items / defender_items 下定义

## 可配置项与调试
- 切换 item 文件名：环境变量 POKEMON_ITEMS_FILE（可选，项目目前默认使用 items_custom.yaml）
- 若输出过多或需要简洁，可注释 main() 中的提示块（已提供注释版）
- 若怀疑特性/道具未生效：检查 YAML 名称是否有前后空格，程序会 strip 名称再匹配

## 常见调整建议
- 想更真实（官方）规则：将猛火等 HP% 特性按 current_hp 条件触发（代码里可选择开启/关闭）。
- 想更平滑的随机效果：可改为保留浮点直到最后再取整（但会改变当前的严格步骤结果）。

## 例子与验证
- 若期望结果为“修正 x4.5，伤害 238~280”，请保证：
  - other_modifiers = 1.5 (天气) × 1.5 (猛火) × 2.0 (电气球 effect:damage) = 4.5
  - 使用本计算器的四步取整会给出接近该区间的结果（若 base_damage 与参考工具一致）。

---