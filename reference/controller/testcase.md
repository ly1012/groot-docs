---
outline: deep
---

该控制器用来在某个步骤中执行其他测试用例。

## 封装业务逻辑

测试用例除了测试特定场景外，还可以封装为一个业务逻辑组件，用在其他测试用例中。或者我们可以直接理解为一个函数，用于执行一些特定逻辑。

- 对象引用：在用例的变量配置中声明入参和出参名称，名称没有要求，但建议遵循编程语言的变量命名规范。
- 方法调用：代码风格用例推荐使用方法封装业务逻辑，方法参数为入参，方法返回值为出参。

::: code-group

```yaml [Yaml 用例]
name: 业务逻辑封装
variables:
  # 入参，可以理解为函数的形参和参数默认值，类似 Python 的关键字传参
  inParam1: 0
  inParam2: 0
  # 出参，可以理解为函数的返回值，可以有多个出参
  outParam1: 0
steps:
  - name: do something
    noop: 1
    teardownHooks: ${vars.put('outParam1', (inParam1 * inParam1 - inParam2)?int)}
```

```java [Java 用例(不推荐)]
private TestCase bizLogicTestCase() {
    return new TestCase.Builder()
        .name("业务逻辑封装")
        .variables(variables -> variables
            .var("inParam1", 0)
            .var("inParam2", 0)
            .var("outParam1", 0))
        .step(new NoopSampler.Builder()
            .name("do something")
            .teardown(teardown -> teardown
                .hooks("${vars.put('outParam1', (inParam1 * inParam1 - inParam2)?int)}")))
        .build();
}
```

```java [Java 用例]
private int bizLogic(int inParam1, int inParam2) {
    Ref<Integer> res = ref();
    noopWith("do something", action -> action
        .variables(variables -> variables
            .var("inParam1", inParam1)
            .var("inParam2", inParam2))
        .teardown(teardown -> teardown
            .hooks("${vars.put('outParam1', (inParam1 * inParam1 - inParam2)?int)}")
            .apply(ctx -> res.value = lv("outParam1"))));
    return res.value;
}
```

```groovy [Groovy 用例(不推荐)]
private TestCase bizLogicTestCase() {
    return defBuilder(TestCase.Builder.class) {
        name "业务逻辑封装"
        variables {
            var "inParam1", 0
            var "inParam2", 0
            var "outParam1", 0
        }
        step(defBuilder(NoopSampler.Builder.class) {
            name("do something")
            teardown {
                hooks '${vars.put("outParam1", (inParam1 * inParam1 - inParam2) ? int)}'
            }
        })
    }.build()
}
```

```groovy [Groovy 用例]
private int bizLogic(int inParam1, int inParam2) {
    int res = 0
    noopWith("do something") {
        variables {
            var "inParam1", inParam1
            var "inParam2", inParam2
        }
        teardown {
            hooks '${vars.put("outParam1", (inParam1 * inParam1 - inParam2) ? int)}'
            apply {
                res = lv("outParam1")
            }
        }
    }
    return res;
}
```

:::


## 引用已存在用例

引用其他已存在的测试用例，将这些用例当做一个步骤执行（可以理解为函数调用）。

- 对象引用：  
  基于用例独立性原则，执行被引用用例时使用的是新 SessionRunner，但保留引用时的所有配置数据（包括本步骤及往上直到用例级别的所有配置）。  
  执行其他用例时，为了防止变量冲突、避免扩大变量作用域，执行结果（出参）默认保存到步骤自身的上下文中，即执行结果在本步骤之外不可访问，需要手动将结果导出到其他层级变量。
- 方法调用：  
  通过方法封装业务逻辑时，不存在引用用例的情况，本质上还是同一个用例，所以使用的是同一个 SessionRunner。

::: code-group

```yaml [Yaml 用例]
name: 执行其他测试用例示例
variables:
  res: 0
steps:
  - name: 执行封装的业务逻辑
    variables:
      inParam1: 6
      inParam2: 6
      outParam1: 0
    testcase: testcases/controller/refTestCase/testcaseTemplate.yml
    teardown:
      - validate:
          - equalTo: ['${outParam1}', 30]
      # 提取用例执行结果，保存到用例级别变量
      - hooks: ${vars.put('res', outParam1)}
  - name: 后续步骤中访问用例执行结果
    noop: 1
    validate:
      - equalTo: ['${res}', 30]
```

```java [Java 用例(不推荐)]
Ref<Integer> outParam1 = ref();
refTestCase("执行其他测试用例示例", bizLogicTestCase(), Map.of(
    "inParam1", 6, "inParam2", 6, "outParam1", 0
)).then(r -> {
    // 提取用例执行结果
    outParam1.value = (Integer) r.getVariables().get("outParam1");
});
assertThat(outParam1.value).isEqualTo(30);
```

```java [Java 用例]
int res = bizLogic(6, 6);
assertThat(res).isEqualTo(30);
```

```groovy [Groovy 用例(不推荐)]
int outParam1 = 0
refTestCase("执行其他测试用例示例", bizLogicTestCase(),
    ["inParam1": 6, "inParam2": 6, "outParam1": 0]
).then {
    // 提取用例执行结果
    outParam1 = it.getVariables().get("outParam1") as int
}
assertThat(outParam1).isEqualTo(30)
```

```groovy [Groovy 用例]
int res = bizLogic(6, 6)
assertThat(res).isEqualTo(30)
```

:::



