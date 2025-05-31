---
outline: deep
---



提取器接口 Extractor 和断言接口 Assertion 都继承自后置处理器接口 PostProcessor。

统一的接口设计旨在简化概念，方便理解。另一方面，将断言、提取器、后置处理器三者统一起来而非隔绝开来，使得后置处理时，三者可以随意组合，避免对顺序的强制要求。

::: tip 温馨提示
Builder 的 Lazy 和非 Lazy 模式见 [Builder 模式](/guide/writing/setup#builder-模式)。

代码风格用例在非 Lazy 模式下可以使用特殊访问对象，见 [特殊访问对象](/guide/writing/setup#特殊访问对象)。
:::

## 后置处理器写法

teardown、extract 和 validate 位于同一层级。

::: code-group

```yml [Yaml 用例]
name: teardown/extract/validate 同级
steps:
  - name: 同级写法
    noop: 1
    teardown:
      - hooks: ${vars.put("x", 1)}
    extract:
      - jsonpath: ["id", '$.id', {target: '{"id": "abc"}'}]
    validate:
      - equalTo: ['${x?int}', 1]
      - equalTo: ['${id}', "abc"]
```

```java [Java 用例]
@Test(description = "teardown/extract/validate 同级")
public void test1() {
    String json = """
        {"id": "abc"}
        """;
    noopWith("同级写法", noop -> noop
        .teardown(teardown -> teardown
            .hooks("${vars.put('x', 1)}"))
        .extract(extract -> extract
            .jsonpath("id", "$.id", params -> params.target(json)))
        .validate(validate -> validate
            .equalTo("${x?int}", 1)
            .equalTo("${id}", "abc")));
}
```

```groovy [Groovy 用例]
@Test(description = "teardown/extract/validate 同级")
void test1() {
    String json = """
        {"id": "abc"}
        """;
    noopWith("同级写法") {
        teardown {
            hooks '${vars.put("x", 1)}'
        }
        extract {
            jsonpath "id", '$.id', { target json }
        }
        validate {
            equalTo '${x?int}', 1
            equalTo '${id}', "abc"
        }
    }
}
```

:::

extract 和 validate 位于 teardown 中，可以对后置处理器、提取器和断言的顺序做任意组合。

::: code-group

```yml [Yaml 用例]
name: extract 和 validate 位于 teardown 中
steps:
  - name: 适合提取和断言动作较少时使用
    noop: 1
    teardown:
      - hooks: ${vars.put("x", 1)}
      - extract$jsonpath: ["id", '$.id', {target: '{"id": "abc"}'}]
      - validate$equalTo: ['${x?int}', 1]
      - validate$equalTo: ['${id}', "abc"]
```

```yaml [Yaml 用例2]
name: extract 和 validate 位于 teardown 中
steps:
  - name: 写法示例
    noop: 1
    teardown:
      - hooks: ${vars.put("x", 1)}
      - extract:
          - jsonpath: ["id", '$.id', {target: '{"id": "abc"}'}]
      - validate:
          - equalTo: ['${x?int}', 1]
          - equalTo: ['${id}', "abc"]
```

```yaml [Yaml 用例3]
name: extract 和 validate 位于 teardown 中
steps:
  - name: 不使用 type$，即 extract$jsonpath，而是通过 type 字段指定
    noop: 1
    teardown:
      - hooks: ${vars.put("x", 1)}
      - jsonpath: ["id", '$.id', {target: '{"id": "abc"}'}]
        type: extract
      - equalTo: ['${x?int}', 1]
        type: validate
      - equalTo: ['${id}', "abc"]
        type: validate
```

```java [Java 用例]
@Test(description = "extract 和 validate 位于 teardown 中")
public void test2ByJava() {
    String json = """
        {"id": "abc"}
        """;
    noopWith("写法示例", noop -> noop
        .teardown(teardown -> teardown
            .hooks("${vars.put('x', 1)}")
            .extract(extract -> extract
                .jsonpath("id", "$.id", params -> params.target(json)))
            .validate(validate -> validate
                .equalTo("${x?int}", 1)
                .equalTo("${id}", "abc"))));
}
```

```groovy [Groovy 用例]
@Test(description = "extract 和 validate 位于 teardown 中")
void test2() {
    String json = """
        {"id": "abc"}
        """;
    noopWith("写法示例") {
        teardown {
            hooks '${vars.put("x", 1)}'
            extract {
                jsonpath "id", '$.id', { target json }
            }
            validate {
                equalTo '${x?int}', 1
                equalTo '${id}', "abc"
            }
        }
    }
}
```

:::


## 后置执行顺序

- 当 teardown、extract 和 validate 位于同一层级时：
    - 按照 teardown -> extract -> validate 的顺序执行
    - teardown/extract/validate 最多只能出现一次，出现多次时（比如出现两次 validate），仅后面的生效
- 当 extract 和 validate 位于 teardown 中时：
    - extract、validate 和后置处理器的顺序可以随意编排，按照声明顺序执行
    - extract 和 validate 可以出现多次

下面是一个 Groovy 用例：

```groovy
Closure params = {
    target '{"person":{"name":"jack","age":18}}'
}
Ref<String> personName = ref("")
sv("cnt", 0)               // 请回顾章节：变量与函数
groupWith("简单的分组") {    // 分组控制器（没有任何子元素，仅仅执行了前置和后置处理）
    setupBefore {
        hooks('${vars.put("cnt", 1)}')
        assert sv("cnt") == 1
    }
    teardown {
        hooks('${2 + 3}')
        extract {
            jsonpath 'personName', '$.person.name', params
            assert lv('personName') == "jack"

            jsonpath personName, '$.person.name', params
            assert personName.value == "jack"
        }
        validate {         // 没有使用 assert 表示断言操作，因为 assert 是关键字
            def expected = "jack"
            equalTo '${personName}', expected
            equalTo personName.value, expected
        }
        extract {
            jsonpath 'personAge', '$.person.age', params
            assert lv('personAge') == 18
        }
    }
}
```

后置处理按顺序完成了以下动作：

- 执行一个 Hook 前置处理器 `${vars.put("cnt", 1)}`
- 执行一个 Hook 后置处理器 `${2 + 3}`
- 执行一个 JsonPath 提取器，将提取值存储到当前层级的 personName 变量（Groot 变量机制）
- 执行一个 JsonPath 提取器，将提取值存储到 personName 变量（`Ref<String> personName` 编程语言变量机制）
- 先后执行两个 EqualTo 断言
- 再次执行一个 JsonPath 提取器

类似的，我们可以先断言 HTTP 状态码为 200，然后提取数据，然后再次断言。

