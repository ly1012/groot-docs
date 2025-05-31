---
outline: deep
---

Repeat 控制器用于循环执行子元件指定次数，对应的类为 RepeatController。

::: code-group

```yaml [Yaml 用例]
name: RepeatController 示例
variables:
  total: 0
validate:
  - equalTo: ['${total?int}', 9]
steps:
  - name: 重复常量次
    repeat: 3
    steps:
      - name: 模拟一个请求
        repeat: 0
        teardownHooks: ${vars.put('total', total + 1)}
  - name: 重复次数使用表达式计算
    repeat: ${2 * 3}
    steps:
      - name: 模拟一个请求
        repeat: 0
        teardownHooks: ${vars.put('total', total + 1)}
```

```java [Java 用例]
Ref<Integer> count = ref(0);
repeat("重复常量次", 3, () -> {
    count.value++;
});
assertThat(count.value).isEqualTo(3);

Ref<Integer> count2 = ref(0);
repeat("重复次数使用表达式计算", "${1 + 1 + 1}", () -> {
    count2.value++;
});
assertThat(count2.value).isEqualTo(3);
```

```groovy [Groovy 用例]
int count
repeat("重复常量次", 3) {
    count++;
}
assertThat(count).isEqualTo(3);

int count2
repeat("重复次数使用表达式计算", '${1 + 1 + 1}') {
    count2++;
}
assertThat(count2).isEqualTo(3);
```

:::