

使用 Groot 开发自动化测试任务需要具备 Java 编程知识。

Groot 版本要求 JDK 17+、Groovy 4.0+。

## 引入依赖

引入全量依赖，适合入门练习或不需要定制功能的场景。

::: code-group

```xml [Maven]
<dependency>
    <groupId>com.liyunx.groot</groupId>
    <artifactId>groot-all</artifactId>
    <version>0.0.1</version>
</dependency>

<!-- Groot TestNG 集成 -->
<dependency>
    <groupId>com.liyunx.groot</groupId>
    <artifactId>groot-testng</artifactId>
    <version>0.0.1</version>
</dependency>
```

```kotlin [Gradle]
dependencies {
    implementation("com.liyunx.groot:groot-all:0.0.1")
    implementation("com.liyunx.groot:groot-testng:0.0.1")
}

tasks.test {
    useTestNG()
}
```

:::

根据需要引入依赖，其中 groot-functions、groot-http 和 groot-testng 都依赖 groot-core。

::: code-group

```xml [Maven]
<!-- Groot 核心模块 -->
<!-- <dependency>
    <groupId>com.liyunx.groot</groupId>
    <artifactId>groot-core</artifactId>
    <version>0.0.1</version>
</dependency> -->

<!-- Groot 函数模块 -->
<dependency>
    <groupId>com.liyunx.groot</groupId>
    <artifactId>groot-functions</artifactId>
    <version>0.0.1</version>
</dependency>

<!-- Groot HTTP 模块，用于 HTTP 请求 -->
<dependency>
    <groupId>com.liyunx.groot</groupId>
    <artifactId>groot-http</artifactId>
    <version>0.0.1</version>
</dependency>

<!-- Groot TestNG 集成 -->
<dependency>
    <groupId>com.liyunx.groot</groupId>
    <artifactId>groot-testng</artifactId>
    <version>0.0.1</version>
</dependency>
```

```kotlin [Gradle]
dependencies {
    // implementation("com.liyunx.groot:groot-core:0.0.1")
    implementation("com.liyunx.groot:groot-http:0.0.1")
    implementation("com.liyunx.groot:groot-functions:0.0.1")
    implementation("com.liyunx.groot:groot-testng:0.0.1")
}

tasks.test {
    useTestNG()
}
:::

## 一个简单的 Get 请求

简单的创建一个 TestNG 用例类，调用一个 Get 接口，不需要做任何其他设置。

```java
import com.liyunx.groot.testng.GrootTestNGTestCase;
import com.liyunx.groot.testng.annotation.GrootSupport;
import org.testng.annotations.Test;

import static com.liyunx.groot.protocol.http.HttpVirtualRunner.http;

public class GetTest extends GrootTestNGTestCase {

    @Test
    @GrootSupport
    public void testGet() {
        http("访问 TesterHome 首页", http -> http
            .get("https://testerhome.com/topics?page=2"));

        http("第二次访问 TesterHome 首页", http -> http
            .get("https://testerhome.com/topics")
            .queryParam("page", "2"));
    }

}
```

## 配置环境数据

通常我们不希望将 baseUrl 硬编码在业务测试逻辑中，这里将它们提取到环境配置文件。

创建环境配置文件 `src/test/resources/env-test.yml`，配置一个名称为 `test` 的环境。下面的内容表示针对 HTTP 组件配置，对任何 HTTP 请求设置默认 baseUrl 为 `https://testerhome.com/`。

```yaml
http:
  any:
    baseUrl: https://testerhome.com/
```

创建执行引擎配置文件 `src/test/resources/groot-test.yml`（这里的 test 不是环境名称，是个固定值），默认激活 `test` 环境。

```yaml
environment:
  active: test
```

修改上面的用例，去掉 baseUrl 前缀：

```java
@Test
@GrootSupport
public void testGet() {
    http("访问 TesterHome 首页", http -> http
        .get("/topics?page=2"));

    http("第二次访问 TesterHome 首页", http -> http
        .get("/topics")
        .queryParam("page", "2"));
}
```

## 低代码用例

基于上面的环境配置，编写和上面 Java 用例等价的 Yaml 用例。

```java
import com.liyunx.groot.testng.GrootTestNGTestCase;
import com.liyunx.groot.testng.annotation.GrootSupport;
import org.testng.annotations.Test;

import static com.liyunx.groot.SessionRunner.getSession;

public class GetTest extends GrootTestNGTestCase {

    @Test
    @GrootSupport
    public void testGet2() {
        getSession().run("testcases/get.yml");
    }

}
```

Yaml 用例 `src/test/resources/testcases/get.yml`：

```yml
name: 第一个低代码用例
steps:
  - name: 访问 TesterHome 首页
    http:
      url: /topics?page=2
      method: GET
  - name: 第二次访问 TesterHome 首页
    http:
      url: /topics
      method: GET
      params:
        page: 2
```

## Groovy 用例

如果你熟悉 Groovy 语法，使用 Groovy 用例会让用例书写更简洁。

引入 Groovy 插件支持（用于 Groovy 编译）：

::: code-group

```xml [Maven]
<build>
    <plugins>
            <plugin>
                <groupId>org.codehaus.gmavenplus</groupId>
                <artifactId>gmavenplus-plugin</artifactId>
                <version>3.0.2</version>
                    <executions>
                        <execution>
                            <goals>
                                <goal>compile</goal>
                                <goal>compileTests</goal>
                            </goals>
                        </execution>
                    </executions>
            </plugin>
    </plugins>
</build>
```

```kotlin [Gradle]
plugins {
    id("groovy")
}
```

:::

在 `src/test/groovy` 目录下创建 Groovy 类，如下所示。

```groovy
import com.liyunx.groot.testng.GrootTestNGTestCase
import com.liyunx.groot.testng.annotation.GrootSupport
import org.testng.annotations.Test

import static com.liyunx.groot.protocol.http.HttpVirtualRunner.http

class GroovyGetTest extends GrootTestNGTestCase{

    @Test
    @GrootSupport
    public void testGet() {
        http("访问 TesterHome 首页") {
            get("/topics?page=2")
        }

        http("第二次访问 TesterHome 首页") {
            get("/topics")
            queryParam("page", "2")
        }
    }

}
```

