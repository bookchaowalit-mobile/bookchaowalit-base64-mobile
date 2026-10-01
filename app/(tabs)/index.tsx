import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { convert, MAX_INPUT_CHARS, sizeLabel } from "../../lib/base64";

type Mode = "encode" | "decode";

export default function Base64Screen() {
  const [mode, setMode] = useState<Mode>("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState("Hello, สวัสดี 👋");

  const result = convert(input, mode, urlSafe);

  const swap = () => {
    if (!result.ok) return;
    setInput(result.output);
    setMode(mode === "encode" ? "decode" : "encode");
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.segment} accessibilityRole="tablist">
        {(["encode", "decode"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[styles.segmentItem, mode === m && styles.segmentActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === m }}
          >
            <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
              {m === "encode" ? "Text → Base64" : "Base64 → Text"}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === "encode" && (
        <View style={styles.switchRow}>
          <Text style={styles.label}>URL-safe (-, _ and no padding)</Text>
          <Switch value={urlSafe} onValueChange={setUrlSafe} accessibilityLabel="URL-safe output" />
        </View>
      )}

      <Text style={styles.label}>{mode === "encode" ? "Text (UTF-8)" : "Base64"}</Text>
      <TextInput
        style={[styles.input, styles.area]}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        importantForAutofill="no"
        maxLength={MAX_INPUT_CHARS + 1}
        value={input}
        onChangeText={setInput}
        accessibilityLabel={mode === "encode" ? "Text to encode" : "Base64 to decode"}
      />

      <Text style={styles.label}>{mode === "encode" ? "Base64" : "Text"}</Text>
      <View style={[styles.output, !result.ok && styles.outputError]} accessibilityLiveRegion="polite">
        <Text selectable style={result.ok ? styles.outputText : styles.errorText}>
          {result.ok ? result.output || " " : result.error}
        </Text>
      </View>
      {result.ok && (
        <Text style={styles.meta}>
          {sizeLabel(input)} → {sizeLabel(result.output)}
        </Text>
      )}

      <View style={styles.actions}>
        <Button label="Use output as input" onPress={swap} disabled={!result.ok} />
        <Button label="Clear" onPress={() => setInput("")} />
      </View>
    </ScrollView>
  );
}

function Button({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 16 },
  segment: { flexDirection: "row", backgroundColor: "#E3ECF7", borderRadius: 10, padding: 4, marginBottom: 12 },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  segmentActive: { backgroundColor: "#2F6DB5" },
  segmentText: { color: "#2A5A8C", fontWeight: "600" },
  segmentTextActive: { color: "#fff" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 13, color: "#555", marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16 },
  area: { minHeight: 110, textAlignVertical: "top" },
  output: { backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#ccc", padding: 12, minHeight: 80 },
  outputError: { borderColor: "#B00020" },
  outputText: { fontSize: 16, color: "#222", fontFamily: "monospace" },
  errorText: { fontSize: 14, color: "#B00020" },
  meta: { fontSize: 12, color: "#666", marginTop: 4 },
  actions: { flexDirection: "row", gap: 12, marginTop: 16, marginBottom: 32 },
  button: { flex: 1, backgroundColor: "#2F6DB5", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#8A9BB0" },

  buttonText: { color: "#fff", fontWeight: "600" },
});
