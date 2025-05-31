---
outline: deep
---

相等断言 `EqualToAssertion extends StandardAssertion<Object, Object>`。

属性说明：

| 属性名称 | 属性值类型 | 属性含义 | 示例 |
| -- | -- | -- | -- |
| check | 任意类型 | 实际值，即要检查的值 | 'abc' |
| expect | 任意类型 | 预期值 | 'ABC' |
| ignoreCase | boolean | 字符串比较时是否忽略大小写 | true |

- check 和 expect 

::: code-group

```yaml [Yaml 用例]
# 标准写法
- equalTo:
    check: 'abc'
    expect: 'ABC'
    ignoreCase: true

# 位置参数写法
- equalTo: ['abc', 'ABC', {ignoreCase: true}]
```

```java [Java 用例]
equalTo("abc", "ABC", params -> params.ignoreCase())
```

```groovy [Groovy 用例]
equalTo "abc", "ABC", { ignoreCase() }
```

:::

