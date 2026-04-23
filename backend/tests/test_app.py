import types
import unittest
from pathlib import Path
import sys
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

stub_crew = types.ModuleType("crew")
stub_crew.run_phase1_reactions = lambda personas, user_input: []
sys.modules.setdefault("crew", stub_crew)

stub_debate = types.ModuleType("debate")
stub_debate.run_phase2_debate = lambda personas, phase1_reactions, user_input: []
sys.modules.setdefault("debate", stub_debate)

stub_steer = types.ModuleType("steer")
stub_steer.steer_debate = lambda message, history, personas: []
sys.modules.setdefault("steer", stub_steer)

stub_summary = types.ModuleType("summary_generator")
stub_summary.generate_summary = lambda phase1_reactions, phase2_debate: {}
sys.modules.setdefault("summary_generator", stub_summary)

import main


class OrbitApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(main.app)

    def test_simulate_runs_full_pipeline(self) -> None:
        personas = [
            {"id": "end_user", "name": "The End User"},
            {"id": "skeptic", "name": "The Skeptic"},
            {"id": "devils_advocate", "name": "The Devil's Advocate"},
            {"id": "power_user", "name": "The Power User"},
            {"id": "builder", "name": "The Builder"},
        ]
        phase1 = [{"persona": "The End User", "persona_id": "end_user", "message": "Reaction"}]
        phase2 = [{"persona": "The Skeptic", "message": "Debate"}]
        summary = {
            "overall_sentiment": "Mixed",
            "strongest_support": "Builder",
            "biggest_concern": "User friction",
            "explore_next": "Where churn happens",
        }

        with patch.object(main, "detect_intent", return_value="feature_decision") as detect_mock, \
             patch.object(main, "select_context_personas", return_value=personas[3:]), \
             patch.object(main, "run_phase1_reactions", return_value=phase1) as phase1_mock, \
             patch.object(main, "run_phase2_debate", return_value=phase2) as phase2_mock, \
             patch.object(main, "generate_summary", return_value=summary):
            response = self.client.post("/simulate", json={"input": "Should we add AI notes?"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["intent"], "feature_decision")
        self.assertEqual(payload["intent_source"], "detected")
        self.assertEqual(payload["phase1_reactions"], phase1)
        self.assertEqual(payload["phase2_debate"], phase2)
        self.assertEqual(payload["summary"], summary)
        detect_mock.assert_called_once_with("Should we add AI notes?")
        phase1_mock.assert_called_once()
        phase2_mock.assert_called_once()

    def test_simulate_accepts_manual_intent_override(self) -> None:
        with patch.object(main, "detect_intent") as detect_mock, \
             patch.object(main, "select_context_personas", return_value=[]), \
             patch.object(main, "run_phase1_reactions", return_value=[]), \
             patch.object(main, "run_phase2_debate", return_value=[]), \
             patch.object(main, "generate_summary", return_value={
                 "overall_sentiment": "Mixed",
                 "strongest_support": "None",
                 "biggest_concern": "None",
                 "explore_next": "None",
             }):
            response = self.client.post(
                "/simulate",
                json={"input": "Should we launch now?", "intent_override": "timing_strategy"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["intent"], "timing_strategy")
        self.assertEqual(payload["intent_source"], "manual_override")
        detect_mock.assert_not_called()

    def test_steer_returns_mocked_continuation(self) -> None:
        continuation = [{"persona": "The Builder", "message": "We need scope control."}]

        with patch.object(main, "steer_debate", return_value=continuation) as steer_mock:
            response = self.client.post(
                "/steer",
                json={
                    "message": "What if we made it opt-in?",
                    "conversation_history": [
                        {"persona": "The End User", "phase": "debate", "message": "This feels useful."}
                    ],
                    "personas": [{"id": "builder", "name": "The Builder"}],
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"debate_continuation": continuation})
        steer_mock.assert_called_once()


if __name__ == "__main__":
    unittest.main()
