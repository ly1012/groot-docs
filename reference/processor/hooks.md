---
outline: deep
---

Hooks 包括前置 Hooks 处理器（`HooksPreProcessor`）和后置 Hooks 处理器（`HooksPostProcessor`）。

Hooks 表达式必须包含至少一个表达式（`${}`），用于执行特定操作，否则没有意义。

Hooks 前/后置处理器写法：

::: code-group

```yaml [Yaml 用例]
# 标准写法
- hooks:      # 处理器类的唯一关键字
    hooks:    # 处理器类的属性（成员变量）
        - ${sVars.put('x', 0)}
        - ${sVars.put('y', 0)}

# 简写语法（多个 Hook 表达式）
- hooks:
    - ${sVars.put('x', 0)}
    - ${sVars.put('y', 0)}

# 简写语法（单个 Hook 表达式）
- hooks: ${sVars.put('x', 0)}
```

```java [Java 用例]
// 多个 Hook 表达式
hooks(hooks -> hooks
    .hook("${vars.put('x', 0)}")
    .hook("${vars.put('y', 0)}"))
hooks("${vars.put('x', 0)}", "${vars.put('y', 0)}")

// 单个 Hook 表达式
hooks("${vars.put('x', 0)}")
```

```groovy [Groovy 用例]
// 多个 Hook 表达式
hooks {
    hook '${vars.put('x', 0)}'
    hook '${vars.put('y', 0)}'
}
hooks '${vars.put('x', 0)}", "${vars.put('y', 0)}'

// 单个 Hook 表达式
hooks '${vars.put('x', 0)}'
```

:::

Hooks 处理器可以出现的位置（下面仅演示单个 Hook 表达式，多个 Hook 表达式同上面的写法）：

::: code-group

```yaml [Yaml 用例]
# 支持 setupBefore、setupAfter 和 teardown 三个节点
setupBefore:
    - hooks: ${vars.put('x', 0)}
setupAfter:
    - hooks: ${vars.put('x', 0)}
# setupBefore、setupAfter 同时存在时，支持合并写法
setup:
    before:
        - hooks: ${vars.put('x', 0)}
    after:
        - hooks: ${vars.put('x', 0)}
teardown:
    - hooks: ${vars.put('x', 0)}

# 当仅有一个前后置处理器，且为 Hook 表达式时，可以直接使用下面的写法
setupBeforeHooks: ${vars.put('x', 0)}
setupAfterHooks: ${vars.put('x', 0)}
teardownHooks: ${vars.put('x', 0)}
```

```java [Java 用例]
// 支持 setupBefore、setupAfter 和 teardown 三个节点
setupBefore(setup -> setup
    .hooks("${vars.put('x', 0)}"))
setupAfter(setup -> setup
    .hooks("${vars.put('x', 0)}"))
// setupBefore、setupAfter 同时存在时，支持合并写法
setup(setup -> setup
    .before(before -> before
        .hooks("${vars.put('x', 0)}"))
    .after(after -> after
        .hooks("${vars.put('x', 0)}")))
teardown(teardown -> teardown
    .hooks("${vars.put('x', 0)}"))
```

```groovy [Groovy 用例]
// 支持 setupBefore、setupAfter 和 teardown 三个节点
setupBefore {
    hooks '${vars.put('x', 0)}'
}
setupAfter {
    hooks '${vars.put('x', 0)}'
}
// setupBefore、setupAfter 同时存在时，支持合并写法
setup {
    before {
        hooks '${vars.put('x', 0)}'
    }
    after {
        hooks '${vars.put('x', 0)}'
    }
}
// 上面的合并写法，在 Groovy 用例中，IDEA 缺少方法提示，可以使用下面这种写法
setup {
    hooks '${vars.put('x', 0)}'
} {
    hooks '${vars.put('x', 0)}'
}
teardown {
    hooks '${vars.put('x', 0)}'
}
```

:::



