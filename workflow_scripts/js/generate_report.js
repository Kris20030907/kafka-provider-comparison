/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const {Octokit} = require("@octokit/rest");

const repoName = process.env.GITHUB_REPOSITORY_NAME;
const issue_number = 1; // 这个值应该根据你的需求来设置

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const fs = require('fs');

const readFileContentSync = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
};

const path = require('path');

const readJsonFilesSync = () => {
    const workspaceHome = process.env.WORKSPACE_HOME;
    if (!workspaceHome) {
        throw new Error('Env WORKSPACE_HOME not set');
    }

    const filePaths = [
        'workflow_scripts/js/BENCHMARK_RESULT_AUTOMQ.info',
        'workflow_scripts/js/BENCHMARK_RESULT_KAFKA.info',
        'workflow_scripts/js/EXTRACTED_DATA_AUTOMQ.info',
        'workflow_scripts/js/EXTRACTED_DATA_KAFKA.info'
    ].map(file => path.join(workspaceHome, file));

    const jsonDataAutoMQ = readFileContentSync(filePaths[0]);
    const jsonDataKafka = readFileContentSync(filePaths[1]);
    const extractedDataAutoMQ = readFileContentSync(filePaths[2]);
    const extractedDataKafka = readFileContentSync(filePaths[3]);

    return {jsonDataAutoMQ, jsonDataKafka, extractedDataAutoMQ, extractedDataKafka};
};

const {jsonDataAutoMQ, jsonDataKafka, extractedDataAutoMQ, extractedDataKafka} = readJsonFilesSync();

// Extract latency metrics
// ---- AutoMQ
const latencyAvgAutoMQ = jsonDataAutoMQ.aggregatedEndToEndLatencyAvg.toFixed(2);
const latency95pctAutoMQ = jsonDataAutoMQ.aggregatedEndToEndLatency95pct.toFixed(2);
const latency99pctAutoMQ = jsonDataAutoMQ.aggregatedEndToEndLatency99pct.toFixed(2);
// --- Kafka
const latencyAvgKafka = jsonDataKafka.aggregatedEndToEndLatencyAvg.toFixed(2);
const latency95pctKafka = jsonDataKafka.aggregatedEndToEndLatency95pct.toFixed(2);
const latency99pctKafka = jsonDataKafka.aggregatedEndToEndLatency99pct.toFixed(2);

// Extract specific fields from benchmark log json and extracted data
const {
    workload_config: workload_config_automq,
    producer_config: producer_config_automq,
    consumer_config: consumer_config_automq,
    topic_config: topic_config_automq,
    replication_factor: replication_factor_automq,
    average_throughput: average_throughput_automq,
    average_pub_latency: average_pub_latency_automq,
    p99_pub_latency: p99_pub_latency_automq
} = extractedDataAutoMQ;

const {
    workload_config: workload_config_kafka,
    producer_config: producer_config_kafka,
    consumer_config: consumer_config_kafka,
    topic_config: topic_config_kafka,
    replication_factor: replication_factor_kafka,
    average_throughput: average_throughput_kafka,
    average_pub_latency: average_pub_latency_kafka,
    p99_pub_latency: p99_pub_latency_kafka
} = extractedDataKafka;

const average_throughput_automq_new=parseFloat(average_throughput_automq).toFixed(2);
const average_throughput_kafka_new=parseFloat(average_throughput_kafka).toFixed(2);


const extractWorkloadConfig = (config) => {
    const keys = [
        'name', 'topics', 'partitionsPerTopic', 'partitionsPerTopicList', 'randomTopicNames',
        'keyDistributor', 'messageSize', 'useRandomizedPayloads', 'randomBytesRatio',
        'randomizedPayloadPoolSize', 'payloadFile', 'subscriptionsPerTopic', 'producersPerTopic',
        'producersPerTopicList', 'consumerPerSubscription', 'producerRate', 'producerRateList',
        'consumerBacklogSizeGB', 'backlogDrainRatio', 'testDurationMinutes', 'warmupDurationMinutes',
        'logIntervalMillis'
    ];

    if (!config) {
        console.error('Configuration is undefined or null');
        return '';
    }
    const pairs = keys.map(key => `${key}: ${config[key]}`);
    return pairs.join('\n');
};

//--- AutoMQ
const workloadConfigPairsAutoMQ = extractWorkloadConfig(workload_config_automq);
const configToKeyValuePairs = (config) => {
    if (!config) {
        return '';
    }
    return config.split(', ').map(pair => pair.replace('=', ': ')).join('\n');
};
const producerConfigPairsAutoMQ = configToKeyValuePairs(producer_config_automq);
const consumerConfigPairsAutoMQ = configToKeyValuePairs(consumer_config_automq);
const topicConfigPairsAutoMQ = configToKeyValuePairs(topic_config_automq);

//--- Kafka
const workloadConfigPairsKafka = extractWorkloadConfig(workload_config_kafka);
const producerConfigPairsKafka = configToKeyValuePairs(producer_config_kafka);
const consumerConfigPairsKafka = configToKeyValuePairs(consumer_config_kafka);
const topicConfigPairsKafka = configToKeyValuePairs(topic_config_kafka);

// Costs are directly used from the steps
// --- AutoMQ
const baselineCostAutoMQ = process.env.BASELINE_COST_AUTOMQ;
const usageCostAutoMQ = process.env.USAGE_COST_AUTOMQ;
const totalCostAutoMQ = process.env.TOTAL_COST_AUTOMQ;
// --- Kafka
const baselineCostKafka = process.env.BASELINE_COST_KAFKA;
const usageCostKafka = process.env.USAGE_COST_KAFKA;
const totalCostKafka = process.env.TOTAL_COST_KAFKA

// Get current date and time
const now = new Date();
const currentDate = now.toISOString().split('T')[0];
const currentTime = now.toTimeString().split(' ')[0];

// Generate a Markdown formatted report
const markdownReport = `
  ## AutoMQ Benchmark VS. Result 🚀
  #### Benchmark Info
  **Report Generated:** ${currentDate} ${currentTime}
  #### Workload Configuration
  ${workloadConfigPairsAutoMQ}
  #### Producer Configuration
  ${producerConfigPairsAutoMQ}
  #### Consumer Configuration
  ${consumerConfigPairsAutoMQ}
  #### Topic Configuration
  ${topicConfigPairsAutoMQ}
  #### replicationFactor
  [AutoMQ] ${replication_factor_automq}
  [Kafka] ${replication_factor_kafka}
  #### Average Throughput
  Average Throughput [AutoMQ]: ${average_throughput_automq_new} MB/s
  Average Throughput [Kafka]: ${average_throughput_kafka_new} MB/s

  > Cost Estimate Rule: Check explanation under cost-explanation directory of this repository


  | Kafka Provider | Pub Latency (ms) avg | Pub Latency (ms) P99 | E2E LatencyAvg(ms) | E2E P95 Latency(ms) | E2E P99 Latency(ms) | Baseline Cost | Usage Cost | Total Cost |
  | ---------------- | ------------------ |  ------------------ |  ------------------ | ------------------- | ------------------- | ------------- | ---------- | ---------- |
  | AutoMQ           | ${average_pub_latency_automq}      | ${p99_pub_latency_automq}      |${latencyAvgAutoMQ}      | ${latency95pctAutoMQ}     | ${latency99pctAutoMQ}     | ${baselineCostAutoMQ} | ${usageCostAutoMQ} | ${totalCostAutoMQ} |
  | Apache Kafka           | ${average_pub_latency_kafka}      |${p99_pub_latency_kafka}      |${latencyAvgKafka}      | ${latency95pctKafka}     | ${latency99pctKafka}     | ${baselineCostKafka} | ${usageCostKafka} | ${totalCostKafka} |
`;

async function generateAndPostReport() {
    console.log(`Issue Number: ${markdownReport}`);

    const [repoOwnerApi, repoNameApi] = repoName.split('/');

    try {
        await octokit.rest.issues.createComment({
            owner: repoOwnerApi,
            repo: repoNameApi,
            issue_number: issue_number,
            body: markdownReport
        });
        console.log('Comment created successfully');
    } catch (error) {
        console.error('Error creating comment:', error);
    }
}

generateAndPostReport();