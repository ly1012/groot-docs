---
outline: deep
---

Groot 工具中有两种类型的配置文件：

- 应用配置文件：同一个 JVM 内共享一份应用配置数据，这些配置在 Groot 实例之间共享，对应 ApplicationConfig 和 ApplicationData 类。
    - 应用配置文件：比如 groot-test.yml
- 实例配置文件：Groot 实例化对象独享的配置，对应 Configuration 类。注意，即便两个 Groot 实例读取同一个配置文件，生成的配置对象也是两个不同的对象。
    - 全局配置文件：所有环境共享的配置数据，比如 global.yml
    - 环境配置文件：每个环境单独的配置数据，比如 env-test.yml

## 应用配置

应用配置中包括两部分内容，整个应用（JVM）共享的配置、每个 Groot 实例默认的一些配置。

配置项汇总：

| 配置名称 | 值类型 | 配置含义 | 示例 |
| -- | -- | -- | -- |
| workDirectory | String | 工作目录 | `src/test/resources` |
| environment.filePrefix | String | 环境配置文件默认前缀 | `env-` |
| environment.active | String | 要激活的环境名称 | test |
| allure | boolean | 是否启用 Allure 报告插件 | true |


### 应用共享配置

自动读取：扩展注册信息，比如注册了哪些扩展类，扩展类的关键字是什么。

groot 应用配置文件（比如 groot-test.yml）包含以下配置项：

- workDirectory 工作目录，所有本地文件读写时，以该目录为根目录。
    - 比如工作目录为 `/Users/groot`，文件路径为 `data/users.csv`，则最终路径为 `/Users/groot/data/users.csv`。
    - 当工作目录为相对路径时，`JVM 工作目录 + workDirectory` 为根目录。JVM 工作目录为执行 JVM 启动命令时的终端路径。当通过 Maven/Gradle 执行时，JVM 工作目录为项目根目录。
    - 默认工作目录为 `src/test/resources`。


### 实例默认配置

Groot 实例的默认配置项。

- environment 环境相关配置
    - filePrefix 环境文件前缀，默认为 `env-`，比如 `env-test.yml` 表示测试环境配置文件。支持 `env/` 这样的文件夹作为前缀，比如 `env/test.yml` 表示测试环境配置文件。
    - active 使用哪个环境，值为环境名称。
- allure 是否启用 Allure 报告插件，true 表示启用。启用后将注册所有查找到的 AllureFilter 实例，Allure 报告中会展示步骤信息。


## 应用配置文件读取顺序

按照以下优先级读取应用配置文件（按优先级从高到低排序）。

- `-Dgroot.config.location` 指定文件位置
- JVM 工作目录下符合条件的文件：
    - groot-test.yml
    - groot-test.yaml
    - groot-test.properties
    - groot.yml
    - groot.yaml
    - groot.properties
- classpath 中符合条件的文件：
    - groot-test.yml
    - groot-test.yaml
    - groot-test.properties
    - groot.yml
    - groot.yaml
    - groot.properties

Maven 小知识：

- 当运行 src/test/java 或 src/test/groovy 下的类（测试）时，将 src/test/resources/ 下的文件编译进 classpath。
- 当运行 src/main/java 或 src/main/groovy 下的类（测试）时，将 src/main/resources/ 下的文件编译进 classpath。

