---
outline: deep
---

Groot 是基于 Java 开发的工具，对项目没有特殊要求，完全遵循 Java 项目的通常约定。

我们只需按照正常的 Java 项目流程创建一个 Maven 项目或 Gradle 项目即可。

## 项目结构

默认情况下，Groot 基于本地文件进行数据加载，此时对项目目录和一些文件名称有一些默认约定。

数据加载默认根目录为 `src/test/resources`。如果你不需要多环境管理或全局配置数据，可以不用创建这些文件，Groot 会默认创建一个空的全局上下文、空的环境上下文。

```yml
project
    src
        test
            resources
                global.yml      # 全局配置文件
                env-test.yml    # 测试环境配置文件（除了 default 为保留名称外，环境名称任意）
                env-dev.yml     # 开发环境配置文件
                groot-test.yml  # 执行配置文件（应用配置文件）
```

## 动态 Builder 特性

::: tip 温馨提示
当使用配置风格用例（Yaml/JSON）时，不涉及下面所说的 Builder 类，不用在编写测试前先编译一次。

当使用代码风格用例时，如果构建脚本或文件中引入了新的扩展模块，则需要先编译重新生成新的 Builder 类（加入新扩展的方法）。
:::

**问题背景**

每个自动化测试项目所依赖的扩展组件的数量和类型是不确定的，也可能依赖的是公司私有的扩展组件，因此 Groot 无法直接提供一个可自动扩展 API 的用户入口类（即 Builder 类）。 也就是说，入口类提供的能力应该由项目依赖决定，它是可变的。另一方面，我们无法在某一个非用户 Jar 中声明入口类的所有能力。

有没有其他方法解决该问题呢？也有，比如下面的这些方案：

- 用户传入，例如 `apply(HttpConfigItem.KEY, configItem)` 代替 `http {...}` 或 `apply(JsonPathExtractor.of("name", "$.jsonpath"))` 代替 `jsonpath("name", "$.jsonpath")`。这就好比我们使用 Map 来传递数据，不再使用类对象来传递数据，虽然可以随意扩展，但缺乏 IDE 提示。
- 自定义子类继承原有的父类，增加子类方法，然后使用子类而不是父类。比如在自己项目中添加子类使用子类、通过代理或字节码机制动态生成增强的子类（缺乏 IDE 提示，因为我们还是无法预定义所有接口方法）。另外，groot-core 需要知道这些子类的存在，比如用例级别也需要对 HTTP 协议进行配置。

不管是哪种方法，都明显不符合 Groot 简化用例编写的设计初衷。我们知道在其他语言中可以动态增强已有的类，比如 Groovy 的元编程、Python 的猴子补丁、JavaScript 的原型链，但 Java 并不支持这种特性。

**解决方案**

虽然语言层面没有提供直接的支持，但我们可以通过一些技巧来实现，Groot 使用扩展类 ExtensibleXXX 来解决这个问题，它被设计用于将项目依赖的所有扩展模块（比如 groot-http）的能力集成进这些扩展类， 而入口类（比如 AllConfigBuilder 等等）继承自这些扩展类，达到修改入口能力的效果（入口能力可插拔）（使用类覆盖，不修改原代码）。

修改构建文件，添加下面的插件或任务。当我们编译时，这些插件或任务会自动帮我们从依赖中提取并生成所有 ExtensibleXXX 扩展类。

::: code-group

```xml [Maven]
<!-- 如果项目直接引用了 groot-all 依赖且没有增加新的扩展，可以禁用该插件 -->
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <version>3.5.0</version>
    <executions>
        <execution>
            <id>Generate Groot Builder Sources</id>
            <phase>generate-sources</phase>
            <goals>
                <goal>exec</goal>
            </goals>
            <configuration>
                <executable>java</executable>
                <arguments>
                    <argument>--add-exports=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED</argument>
                    <argument>--add-exports=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED</argument>
                    <argument>--add-exports=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED</argument>
                    <argument>--add-exports=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED</argument>
                    <argument>--add-exports=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED</argument>
                    <argument>--add-exports=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED</argument>
                    <argument>-classpath</argument>
                    <classpath/>
                    <argument>com.liyunx.groot.support.ExtensibleSourceGenerator</argument>
                    <!-- 指定当前项目路径 -->
                    <argument>${project.basedir}</argument>
                </arguments>
            </configuration>
        </execution>
    </executions>
</plugin>
```

```kotlin [Gradle Kotlin]
tasks.register<JavaExec>("generateSources") {
    // 配置 JVM 参数
    jvmArgs = listOf(
        "--add-exports=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED",
        "--add-exports=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED",
        "--add-exports=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED",
        "--add-exports=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED",
        "--add-exports=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED",
        "--add-exports=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED"
    )
    // 配置主类
    mainClass.set("com.liyunx.groot.support.ExtensibleSourceGenerator")
    // 使用项目的类路径（确保依赖已包含）
    classpath = sourceSets.main.get().compileClasspath
    // 指定项目根目录
    args(project.rootDir.absolutePath)
}

tasks.compileJava {
    dependsOn("generateSources")
}
```

:::

**实现原理**

动态 Builder 特性的实现需要遵循以下约定：

- 扩展代码：为了方便测试和防止类膨胀，扩展代码应该写在扩展模块 `src/test/java` 目录的 `com.liyunx.groot.builder` 包下， 这样自动化测试项目中同名扩展类最多只有两个（core 包中的一个，项目中的一个）
- 资源生成：通过 Maven 插件/Gradle 任务，在扩展组件 Jar 打包阶段，将所有扩展代码打包进 `src/main/resources` 资源目录下的 `groot/builder` 文件夹下，资源文件名称为扩展类名
- 源码生成：通过 Maven 插件/Gradle 任务，自动扫描所有依赖的资源目录，并生成 ExtensibleXXXBuilder 类源码到当前项目的 `src/main/java` 的 `com.liyunx.groot.builder` 下。或手动调用工具类方法生成类的源码。

资源生成任务

::: code-group 

```xml [Maven]
<!-- 生成扩展类资源文件 -->
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>exec-maven-plugin</artifactId>
    <executions>
        <execution>
            <id>Generate Groot Builder Resources</id>
            <phase>generate-resources</phase>
            <goals>
                <goal>java</goal>
            </goals>
            <configuration>
                <mainClass>com.liyunx.groot.support.ExtensibleResourceGenerator</mainClass>
                <arguments>
                    <!-- 指定当前项目路径 -->
                    <argument>${project.basedir}</argument>
                </arguments>
            </configuration>
        </execution>
    </executions>
</plugin>
```

:::

**平台开发**

自动化测试平台如果需要支持动态上传 Jar 并使 Jar 生效，通常会创建新的 ClassLoader 实例。为了支持 Groot 动态 Builder 的特性，可以在生成新 Builder 类源码并编译后，使用新的 ClassLoader 在加载其他 Jar 之前加载这些 Builder 类。

如果你不打算在平台上支持 Java/Groovy 形式的用例，则不需要支持动态 Builder 特性。

