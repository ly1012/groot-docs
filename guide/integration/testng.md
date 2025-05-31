---
outline: deep
---

## 引入依赖

groot-testng 仅依赖 groot-core 组件。完整的 Groot 功能需要继续引入其他组件。

::: code-group

```xml [Maven]
<dependency>
    <groupId>com.liyunx.groot</groupId>
    <artifactId>groot-testng</artifactId>
    <version>0.0.2</version>
</dependency>
```

```kotlin [Gradle]
dependencies {
    implementation("com.liyunx.groot:groot-testng:0.0.2")
}
```

:::


## Groot 集成

测试类继承 Groot 基类：`GrootTestNGTestCase` 或 `AbstractGrootTestNGTestCase`，测试方法上添加 `@GrootSupport` 注解。

```java
import com.liyunx.groot.testng.GrootTestNGTestCase;
import com.liyunx.groot.testng.annotation.GrootSupport;
import org.testng.annotations.Test;

import static com.liyunx.groot.SessionRunner.getSession;
import static com.liyunx.groot.protocol.http.HttpVirtualRunner.http;

public class GetTest extends GrootTestNGTestCase {

    @Test
    @GrootSupport
    public void testGetByJava() {
        http("访问 TesterHome 首页", http -> http
            .get("/topics?page=2"));

        http("第二次访问 TesterHome 首页", http -> http
            .get("/topics")
            .queryParam("page", "2"));
    }

    @Test
    @GrootSupport
    public void testGetByYaml() {
        getSession().run("testcases/get.yml");
    }
    
}
```

`testcases/get.yml` 文件。

```yml
name: 第一个低代码用例
steps:
  - name: 访问 TesterHome 首页
    http:
      url: /topics?page=2
      method: GET
    validate:
      - statusCode: 200
  - name: 第二次访问 TesterHome 首页
    http:
      url: /topics
      method: GET
      params:
        page: 2
    validate:
      - statusCode: 200
```

## 用例参数化

### @DataSource

@DataSource 提供快捷的用例参数化能力，本功能不依赖 Groot 组件。

::: code-group

```json [参数化文件]
[
  {"username": "admin", "password": "123456"},
  {"username": "user", "password": "666666"}
]
```

```java [用例]
@DataSource("data/test.json")
@Test
public void testAnnotationTransformer2(Map<String, Object> data) {
    System.out.println(data.get("username") + ":" + data.get("password"));
}
```

``` [输出]
admin:123456
user:666666
```

:::

当前支持的文件数据源类型：JSON、Yaml(yml 或 yaml)、CSV、Excel(xls 或 xlsx)。CSV 和 Excel 支持通过参数控制解析行为。

- CSV: `data.csv?format=groot`，所有 format 可用值见 `com.liyunx.groot.dataloader.file.ParametersDataFileLoader.CSVFormatFactory`。
- CSV: `data.csv?delimiter=,&escape=\&quote="`
- Excel(SheetName): `data.xls?name=sheet1`
- Excel(SheetIndex 1-based): `data.xls?index=2`



### @DataFilter

@DataFilter 提供快捷的用例参数化过滤能力，本功能不依赖 Groot 组件。

当前仅支持过滤行功能，slice 属性通过行索引过滤，expr 通过 Groovy 表达式过滤。

**slice**

1-based，值为字符串：

- `[1..3]` 第 1 行到第 3 行
- `[1..]` 第 1 行到最后一行
- `[..4]` 第 1 行到第 4 行
- `[2..-2]` 第 2 行到倒数第 2 行
- `[1, 2, 3]` 第 1 行、第 2 行、第 3 行
- `[1, 3, -4, -1]` 第 1 行、第 3 行、倒数第4 行、倒数第 1 行

**expr**

根据 Groovy 表达式过滤行。

::: code-group

```json [参数化文件]
[
  {"username": "admin", "password": "123456"},
  {"username": "user", "password": "666666"}
]
```

```java [方法参数为 Map 类型]
// 方法参数仅有一个参数且参数类型为 Map 时，expr 中变量名为 Key
@GrootDataSource(value = "test.json", 
                 expr = "username.contains('min') && password <= 333333")
@Test
public void testGrootDataSource(Map<String, Object> data) {
}
```

```java [方法参数为其他类型]
// 方法参数为其他类型：expr 中所有参数（Object[]）的变量名为 data ，第 N 个参数的变量名为 pn
@DataFilter(expr = "p2 < 333333")
@Test(dataProvider = "testData")
public void testGrootDataSource(String username, int password) {
}

@DataProvider(name = "testData")
public Object[][] dp() {
    return new Object[][]{
        {"admin", 123456},
        {"user", 666666}
    };
}
```

:::

### @GrootDataSource

GrootDataSource 是一个组合注解，功能上等价于 `GrootSupport + DataSource + DataFilter`。

```java
@GrootDataSource(
    value = "data/test.csv",
    slice = "[1..-1]", expr = "username == 'admin' && password == '654321'")
@Test(description = "测试 @GrootDataSource")
public void testGrootDataSource(Map<String, Object> arg) {
    login((String) arg.get("username"), Integer.parseInt((String) arg.get("password")));

    // 使用 arg("username") 代替 (String) arg.get("username")
    login(arg("username"), Integer.parseInt(arg("password")));

    assertThat((String) sv("username")).isEqualTo("admin");
    assertThat((String) sv("password")).isEqualTo("654321");

    noopWith("test parameters", action -> action
        .validate(validate -> validate
            .equalTo("${username}", "admin")
            .equalTo("${password}", "654321")));
}

private void login(String username, int password) {
    assertThat(username).isEqualTo("admin");
    assertThat(password).isEqualTo(654321);
}
```

## 分离测试用例日志

见 [分离测试用例日志](/practice/log/sift)。

