---
outline: deep
---

While 控制器与代码中的 While 控制结构相同，当条件满足时就会一直循环执行子元件。对应的类为 WhileController。

## 条件表达式

当条件满足（返回值可转为字符串 true）时就会循环执行子元件。

::: code-group

```yaml [Yaml 用例]
name: While 控制器示例
variables:
  cnt: 10
steps:
  - name: 条件表达式
    while:
      condition: ${cnt > 0}
    steps:
      - name: 循环内容
        noop: 1
        teardownHooks:
          - ${vars.put("cnt", cnt - 1)}
```

```java [Java 用例]
// 这里对变量的使用还是比较繁琐，后续考虑 condition 支持 lambda 表达式，配合 Ref 类进行简化，下面是一个初步设想：
// 如果是 Groovy 用例，可以进一步简化，因为 Groovy 默认会将变量包装为引用类型
// Ref<Integer> total = ref(10);    // 替换 sv("total", 10);
// onWhile("条件表达式", () -> total.value > 0, () -> {
//     total.value--;               // 替换 sv("total", (Integer) sv("total") - 1);
// })
sv("total", 10);
onWhile("条件表达式", "${total > 0}", () -> {
    sv("total", (Integer) sv("total") - 1);
});
```

```groovy [Groovy 用例]
sv("total", 10)
onWhile("条件表达式", '${total > 0}') {
    sv("total", (Integer) sv("total") - 1)
}
```

:::


## 超次限制

While 循环控制器和其他循环控制器相比存在一定的使用风险，如果使用不当可能导致死循环，为此 While 循环控制器引入了循环限制支持。

超次限制：循环超过指定次数则结束循环。

::: code-group

```yaml [Yaml 用例]
name: While 控制器示例
variables:
  cnt: 10
steps:
  - name: 超次限制
    while:
      condition: ${cnt > 0}
      limit: 5
    steps:
      - name: 循环内容
        noop: 1
        teardownHooks:
          - ${sleep(10)}
          - ${vars.put("cnt", cnt + 1)}
```

```java [Java 用例]
sv("cnt", 10);
onWhile("超次限制", it -> it.condition("${cnt > 0}").limit(5), () -> {
    sleep(10);
    sv("cnt", (Integer) sv("cnt") + 1);
});
```

```groovy [Groovy 用例]
sv("cnt", 10)
onWhile("超次限制", { condition '${cnt > 0}' limit 5 }) {
    sleep(10)
    sv("cnt", (Integer) sv("cnt") + 1)
}
```

:::


## 超时限制

超时限制：循环超过指定时长（ms）则结束循环。

::: code-group

```yaml [Yaml 用例]
name: While 控制器示例
variables:
  total: 10
steps:
  - name: 超时限制
    while:
      condition: ${total > 0}
      # 大于 timeout 才会终止，0 ms 可能执行多次，即 endTime - startTime > 0
      # 当值为 -1 时表示最多执行一次，因为执行一次后肯定大于 -1ms
      timeout: 50  # 单位 ms
    steps:
      - name: 循环内容
        noop: 1
        teardownHooks:
          - ${sleep(10)}
          - ${vars.put("total", total + 1)}
```

```java [Java 用例]
sv("total", 10);
onWhile("超时限制", it -> it.condition("${total > 0}").timeout(50), () -> {
    sleep(10);
    sv("total", (Integer) sv("total") + 1);
});
```

```groovy [Groovy 用例]
sv("total", 10)
onWhile("超时限制", { condition '${total > 0}' timeout(50) }) {
    sleep(10)
    sv("total", (Integer) sv("total") + 1)
}
```

:::





