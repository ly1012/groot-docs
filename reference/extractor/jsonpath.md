---
outline: deep
---

JsonPath 提取器使用 `com.jayway.jsonpath:json-path` 库，通过 JsonPath 表达式提取 JSON 字符串中的指定值。

`JsonPathExtractor extends StandardExtractor<Object>` 是标准提取器的子类，支持位置参数写法。

属性说明：

| 属性名称 | 属性值类型 | 属性含义 | 示例 |
| -- | -- | -- | -- |
| refName | String | 变量名称（Groot 变量） | "id" |
| ref | Ref | 变量对象<br/>编程语言变量，仅限代码风格用例 | `Ref<String> ref` |
| expression | String | JsonPath 表达式 | '$.id' |
| default | Object | 提取失败时的默认值 | "oid123456" |
| scope | enum | 提取变量作用域 | "session" |
| target | String | 目标 JSON 字符串 | '{"id": "abc"}' |

::: code-group

```yaml [Yaml 用例]
# 标准写法
- jsonpath:
    refName: "id"
    expression: '$.id'
    target: '{"id": "abc"}'

# 位置参数写法
- jsonpath: ["id", '$.id']  # 默认从响应 Body 中提取
- jsonpath: ["id", '$.id', {target: '{"id": "abc"}', scope: "session"} ]
```

```java [Java 用例]
// 默认从响应 Body 中提取
jsonpath("id", "$.id")
jsonpath("id", "$.id", params -> params.target("{\"id\": \"abc\"}"))

// 将提取结果保存到编程语言的变量 id 中
Ref<String> id = ref();
jsonpath(id, "$.id", params -> params.target("{\"id\": \"abc\"}"))
```

```groovy [Groovy 用例]
// 默认从响应 Body 中提取
jsonpath "id", "$.id"
jsonpath "id", "$.id", { target '{"id": "abc"}' }

// 将提取结果保存到编程语言的变量 id 中
Ref<String> id = ref("")
jsonpath id, '$.id', { target '{"id": "abc"}' }
```

:::


