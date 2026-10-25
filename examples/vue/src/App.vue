<script setup>
import { useSatChecker } from "seo-accessibility-tool/vue";

useSatChecker({ rules: { "link-text": "warning" } }); // starts SAT in development
</script>

<template>
  <p>This paragraph is rendered by Vue.</p>
</template>
