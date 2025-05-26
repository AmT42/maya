import unittest
import sys
import types

# Create minimal fake langchain modules so ChatGpt can be imported without
# the real dependency.
langchain = types.ModuleType("langchain")
sys.modules.setdefault("langchain", langchain)
sys.modules.setdefault("langchain.chat_models", types.ModuleType("chat_models"))
sys.modules.setdefault("langchain.prompts", types.ModuleType("prompts"))
sys.modules.setdefault("langchain.chains", types.ModuleType("chains"))
sys.modules.setdefault(
    "langchain.chains.conversation",
    types.ModuleType("conversation"),
)
sys.modules.setdefault(
    "langchain.chains.conversation.memory",
    types.ModuleType("memory"),
)

class Dummy:
    def __init__(self, *args, **kwargs):
        pass

sys.modules["langchain.chat_models"].ChatOpenAI = Dummy
sys.modules["langchain.prompts"].PromptTemplate = Dummy
sys.modules["langchain.chains"].LLMChain = Dummy
langchain.FewShotPromptTemplate = Dummy
sys.modules["langchain.chains.conversation.memory"].ConversationBufferMemory = Dummy

from app.services.chatgpt.llm import ChatGpt


class TestParseResponse(unittest.TestCase):
    def setUp(self):
        self.chatgpt = ChatGpt(None, None, None, None, None)

    def test_valid_json(self):
        json_str = (
            '{"doctype": "facture", "date": "01/01/2023", '
            '"expediteur": "Free", "recapitulatif": "ok", "google_calendar": null}'
        )
        result = self.chatgpt._parse_response(json_str)
        self.assertIsInstance(result, dict)
        self.assertEqual(result["doctype"], "facture")

    def test_invalid_json(self):
        with self.assertRaises(ValueError):
            self.chatgpt._parse_response('{"doctype": "facture"')

    def test_missing_keys(self):
        with self.assertRaises(ValueError):
            self.chatgpt._parse_response('{"doctype": "facture"}')


if __name__ == "__main__":
    unittest.main()

