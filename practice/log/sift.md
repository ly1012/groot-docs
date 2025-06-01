---
outline: deep
---

当一次执行多条测试用例时，所有日志都在一个文件中不方便进行查看和问题排查。为此，我们需要将每条测试用例的日志隔离开，即一次执行多条测试用例，但可以单独查看某个测试用例的所有日志。

**分离测试用例日志的步骤：**

- *Trace ID 生成和清理：* 在测试用例开始前生成并设置 Trace ID，在测试用例结束后清理 Trace ID。
- *日志分离：* 以 logback 为例，我们可以扩展自定义 Appender 或者使用 SiftingAppender。
- *异步日志跟踪：* Groot 内置了 TraceableTask 包装线程任务，从而跟踪异步任务的日志。

## 1. Trace ID

Trace ID 何时生成，取决于用户使用场景，下面列举了一些常见的使用场景。

### 1.1. TestNG

基于 TestNG 的测试用例，可以通过 TestNG 监听器来完成 TraceID 的生成和清理，如下所示。

::: tip 温馨提示
groot-testng 模块会自动注册 `com.liyunx.groot.testng.listener.TestCaseLogListener` 监听器。
:::

```java
import org.slf4j.MDC;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

/**
 * 设置和清理 TraceID
 */
public class TestCaseLogListener implements ITestListener {

  private static final String KEY = "testcaseId";

  @Override
  public void onTestStart(ITestResult result) {
    setTraceID(result);
  }

  @Override
  public void onTestSuccess(ITestResult result) {
    removeTraceID();
  }

  @Override
  public void onTestFailure(ITestResult result) {
    removeTraceID();
  }

  @Override
  public void onTestSkipped(ITestResult result) {
    removeTraceID();
  }

  @Override
  public void onTestFailedButWithinSuccessPercentage(ITestResult result) {
    removeTraceID();
  }

  @Override
  public void onStart(ITestContext context) {

  }

  @Override
  public void onFinish(ITestContext context) {

  }

  private void setTraceID(ITestResult result){
    MDC.put(KEY, result.getInstanceName() + "." + result.getName());
  }

  private void removeTraceID(){
    if (MDC.get(KEY) != null){
      MDC.remove(KEY);
    }
  }

}
```

## 2. 日志分离

### 2.1. logback

新增一个测试用例日志 Appender，使用 SiftingAppender 根据 TraceID（testcaseId） 筛选每个用例的日志到各自的日志文件。

```xml
<appender name="SIFT" class="ch.qos.logback.classic.sift.SiftingAppender">
    <discriminator>
        <!-- 第一步中设置的 TraceID -->
        <key>testcaseId</key>
        <defaultValue>unknown</defaultValue>
    </discriminator>

    <sift>
        <appender name="FILE-${testcaseId}" class="ch.qos.logback.core.FileAppender">
            <file>${log.home}/case/${testcaseId}.log</file>
            <append>false</append>
            <encoder>
                <pattern>${pattern}</pattern>
            </encoder>
        </appender>
    </sift>
</appender>
```

## 3. 异步日志跟踪

groot-core 内置了 TraceableTask 包装线程任务，从而跟踪异步任务的日志。

使用示例（Java + TestNG）：

```java
public class TestCaseLogListenerTest {

    private static final Logger logger = LoggerFactory.getLogger(TestCaseLogListenerTest.class);

    @Test
    public void testAsyncTask(Method method) throws InterruptedException, ExecutionException {
        String methodName = method.getDeclaringClass().getName() + "." +method.getName();
        File logFile = new File("logs/case/" + methodName + ".0.log");
        if (logFile.exists() && logFile.isFile()) {
            assert logFile.delete();
        }

        logger.info("testAsync Start");
        ExecutorService executorService = Executors.newFixedThreadPool(2);
        executorService.execute(TraceableTask.wrap(() -> {
            logger.info("async task 1 execute");
        }));
        Future<String> future = executorService.submit(TraceableTask.wrap(() -> {
            logger.info("async task 2 execute");
            return "successful";
        }));
        logger.info("async task 2 result: {}", future.get());
        executorService.shutdown();
        executorService.awaitTermination(10, TimeUnit.MINUTES);

        assertThat(logFile).exists();
    }

}
```

查看 `logs/case/com.liyunx.groot.testng.listener.TestCaseLogListenerTest.testAsyncTask.0.log` 内容，异步任务的日志已经被追加到用例 `TestCaseLogListenerTest.testAsyncTask.0` 的日志文件中。

```
17:41:19.574 [main] INFO  c.l.g.testng.listener.TestCaseLogListenerTest29  : testAsync Start 
17:41:19.576 [pool-1-thread-1] INFO  c.l.g.testng.listener.TestCaseLogListenerTest32  : async task 1 execute 
17:41:19.576 [pool-1-thread-2] INFO  c.l.g.testng.listener.TestCaseLogListenerTest35  : async task 2 execute 
17:41:19.577 [main] INFO  c.l.g.testng.listener.TestCaseLogListenerTest38  : async task 2 result: successful  
```
