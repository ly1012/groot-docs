---
outline: deep
---

当前配置风格用例和代码风格用例均依赖 TestNG/Junit 等测试框架进行用例发现和执行，所以用例的参数化功能通过 TestNG/Junit 的参数化特性来实现。

你可以自行开发命令行工具或测试平台，自主决定如何发现和执行用例，并对用例进行参数化测试。

截止当前版本，Groot 已完成和 TestNG 的集成，只需继承基类和添加注解即可开始用例编写。JUnit 暂未完成适配，你需要自己实现适合你项目的基类或 JUnit 扩展实现。

## TestNG

GrootTestNGTestCase 是测试用例基类，全局使用同一个 Groot 实例。如果有其他需求，可以继承 AbstractGrootTestNGTestCase 实现自定义的测试基类。

@GrootDataSource 注解是一个组合注解，功能上等价于 @GrootSupport + @DataSource + @DataFilter，其中 value 属性表示文件数据源的位置，slice 和 expr 属性用于过滤行，只有匹配的行才会执行测试。

```java
public class GrootDataSourceTest extends GrootTestNGTestCase {

    // Yaml 用例
    @GrootDataSource(
        value = "data/test.csv",
        slice = "[1..-1]", expr = "username == 'admin' && password == '654321'")
    @Test(description = "测试 @GrootDataSource")
    public void testGrootDataSourceByYaml(Map<String, Object> arg) {
        getSession().run("testcases/groot_datasource_test.yml");
    }

    // Java 用例
    @GrootDataSource(
        value = "data/test.csv",
        slice = "[1..-1]", expr = "username == 'admin' && password == '654321'")
    @Test(description = "测试 @GrootDataSource")
    public void testGrootDataSource(Map<String, Object> arg) {
        // 直接访问 arg 参数，注意下面的是 arg 方法，不是 arg.get("username")
        assert arg("username") == "admin";

        // 通过 Groot 变量机制使用 arg 参数，arg 参数中的数据会自动被转为 Session 级别变量
        noopWith("test parameters", action -> action
            .validate(validate -> validate
                .equalTo("${username}", "admin")
                .equalTo("${password}", "654321")));
    }

}
```

参数化文件 `data/test.csv` 内容：

```csv
username,password
admin,123456
admin,654321
user,555555
```

更多示例见 [与 TestNG 集成](/guide/integration/testng)。

