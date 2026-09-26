# ============================================================================
# Promptometer Core — TaskAssessor.assess() test suite (zero-dep)
# Ejecutar: `python packages/core/test_assess.py` o `pytest packages/core`
# fixtures/assess-cases.json es la especificación compartida con el port JS.
# ============================================================================

import builtins
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import promptometer_core as pc  # noqa: E402

FIXTURES = os.path.join(HERE, "fixtures", "assess-cases.json")


def _load_cases():
    with open(FIXTURES, encoding="utf-8") as fh:
        return json.load(fh)["cases"]


def _check_case(case):
    r = pc.assess(case["prompt"], case["context"])
    exp = case["expect"]
    got = {
        "score": r["score"],
        "quality": r["quality"],
        "intent": r["intent"],
        "exploration_risk": r["exploration_risk"],
        "suggest_split": r["scope"]["suggest_split"],
        "recommended_tier": r["recommended_tier"],
        "steering": r["steering"],
        "correction": r["correction"],
        "issue_ids": [i["id"] for i in r["issues"]],
        "targets": r["targets"],
        "has_scaffold": bool(r["scaffold"]),
    }
    diffs = {k: (exp[k], got[k]) for k in exp if exp[k] != got[k]}
    assert not diffs, "{}: {}".format(case["name"], diffs)


def test_fixtures():
    for case in _load_cases():
        _check_case(case)


def test_result_shape_is_complete_and_json_safe():
    for prompt in ("", None, 42, "a", "agrega tests unitarios para yunta/intent.py"):
        r = pc.assess(prompt)
        for key in ("score", "quality", "intent", "targets", "grounded", "exploration_risk",
                    "explorationRisk", "scope", "recommended_tier", "recommendedTier",
                    "steering", "correction", "signals", "issues", "tip", "scaffold"):
            assert key in r, key
        assert isinstance(r["tip"], str) and len(r["tip"]) > 10
        dump = json.dumps(r)
        assert "NaN" not in dump


def test_single_tip_prioritizes_highest_severity():
    r = pc.assess("edita auth/inexistente.py para validar el token",
                  {"known_files": ["js/app.js"]})
    assert r["tip"] == r["issues"][0]["message"]
    assert "auth/inexistente.py" in r["tip"]


def test_lang_en_messages():
    r = pc.assess("arreglalo", {"lang": "en"})
    assert r["tip"].startswith("Avoid ambiguous")
    assert r["scaffold"].startswith("In ")


def test_assess_does_no_io():
    real_open = builtins.open
    real_listdir = os.listdir
    real_run = subprocess.run

    def boom(*a, **k):
        raise AssertionError("assess() no debe hacer I/O")

    cases = _load_cases()
    builtins.open, os.listdir, subprocess.run = boom, boom, boom
    try:
        for case in cases:
            pc.assess(case["prompt"], case["context"])
    finally:
        builtins.open, os.listdir, subprocess.run = real_open, real_listdir, real_run


def _cli(*args):
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    out = subprocess.run([sys.executable, os.path.join(HERE, "promptometer_core.py")] + list(args),
                         capture_output=True, text=True, encoding="utf-8", env=env, check=True)
    return json.loads(out.stdout)


def test_cli_assess_json():
    r = _cli("assess", "reviértelo, te equivocaste", "--turn", "2")
    assert r["correction"] is True and r["turn"] == 2


def test_cli_files_from_git():
    r = _cli("assess", "edita auth/inexistente.py", "--files-from", "git", "--compact")
    assert r["grounded"] is True
    assert r["targets"]["missing"] == ["auth/inexistente.py"]


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(" PASS  " + name)
        except Exception as e:  # noqa: BLE001
            failed += 1
            print(" FAIL  {}: {}".format(name, e))
    print("\n{}/{} PASS".format(len(tests) - failed, len(tests)))
    sys.exit(1 if failed else 0)
