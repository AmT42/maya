# import libraries
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain import FewShotPromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.chains.conversation.memory import ConversationBufferMemory 
import json 


class ChatGpt:
    def __init__(self, example, example_template, example_prompt, prefix, suffix) -> None:

        if example is None:
            self.example =[
                    {
                        "requête" : "RECOCASH\nGestion, s\u00e9curisation & optimisation du poste Client\nRL06/OF\nTEL: 01 84 27 05 93\nMAIL: orange.rec@recocash.com\n\u25ba R\u00e9f\u00e9rence 1:\nR\u00e9f\u00e9rence 2\nR\u00e9f\u00e9rence 3\nSOLDE\n:\n:\n022719431\n0251282733-013\nCMTNET210800702\n\u20ac 72,77\nCr\u00e9ancier: ORANGE SA\n111 Q. DU PR\u00c9SIDENT ROOSEVELT 92130 ISSY-LES-MOULINEAUX\nPremi\u00e8re r\u00e9clamation du 30/08/2021\nE\n0332021267PLI001614\n21092405419/210983060/005937/0015/0/0000\nMONSIEUR CELEBI AHMED\nETAGE 3\n58 RUE DE MARSEILLE\n93800 EPINAY SUR SEINE\nRambouillet, le 24 septembre 2021\nPROJET D'INJONCTION DE PAYER\nMadame, Monsieur,\nVous n'avez pas cru devoir r\u00e9gler le solde de \u20ac 72,77.\nNous allons donc transmettre une requ\u00eate aux fins d'injonction de payer au tribunal comp\u00e9tent dont le\nprojet appara\u00eet au verso.\nL'ordonnance rendue vous sera ensuite signifi\u00e9e par un huissier.\nSi vous voulez \u00e9viter cette proc\u00e9dure, vous devez imm\u00e9diatement adresser le solde.\nA d\u00e9faut de r\u00e8glement avant la signification de l'ordonnance, son co\u00fbt sera \u00e0 votre charge.\nNous vous prions d'agr\u00e9er, Madame, Monsieur, l'expression de nos salutations distingu\u00e9es.\nService Pr\u00e9-Judiciaire\n229\nL\nChaus\nRECOCASH-1 rue de Clairefontaine - BP 91-78120 Rambouillet cedex\nSAS au capital de 3 522 607 \u20ac - RCS Versailles B 479 974 115-Code NAF : 8291Z - TVA intracommunautaire: FR37479974\n\u25ba Virement: IBAN: FR7630004008530001000561853 BIC BNPAFRPPXXX\n\u25baCarte Bancaire (site s\u00e9curis\u00e9): https://www.recocash.com\nConform\u00e9ment \u00e0 l'article R 124-4 du Code des Proc\u00e9dures Civiles d'Ex\u00e9cution, vous trouverez ci-apr\u00e8s reproduits le deuxi\u00e8me et troisi\u00e8me alin\u00e9a de\nl'article L.111-8 de ce m\u00eame code: \"Les frais de recouvrement entrepris sans titre ex\u00e9cutoire restent \u00e0 la charge du cr\u00e9ancier, sauf s'ils concement un acte\ndont l'accomplissement est prescrit par la loi. Toute stipulation contraire est r\u00e9put\u00e9e non \u00e9crite, sauf disposition l\u00e9gislative contraire. Cependant, le\ncr\u00e9ancier qui justifie du caract\u00e8re n\u00e9cessaire des d\u00e9marches entreprises pour recouvrer sa cr\u00e9ance peut demander au juge de l'ex\u00e9cution de laisser tout ou\npartie des frais ainsi expos\u00e9s \u00e0 la charge du d\u00e9biteur de mauvaise foi\".\ntime now touto information your concernant convient",
                        "réponse" : "doctype: Injonction de payer, date: 24/09/2021, entite_ou_raison: RECOCASH, info_supplementaires: montant à payer: 72,77 euros, date_payement: le plus tot possible, tel_conctacte: 01 84 27 05 93, mail_contact: orange.rec@recocash.com, IBAN: FR7630004008530001000561853, BIC : BNPAFRPPXXX, site: https://www.recocash.com"
                    }
                ]
        else:
            self.example = example

        if example_template is None:
            # création du template de nos exemples
            self.example_template = """
            Input: {requête}
            Output: {réponse}
            """
        else:
            self.example_template = example_template

        if example_prompt is None:
            self.example_prompt = PromptTemplate(
                input_variables=["requête", "réponse"],
                template=self.example_template
            )
        else:
            self.example_prompt = example_prompt    

        if prefix is None:
            self.prefix = """
                ChatGPT, ta mission est de fonctionner comme un classificateur de documents et un extracteur d'informations pertinentes à partir de textes provenant de la reconnaissance optique de caractères (OCR) sur des images. Tu recevras différents types de documents textuels qui peuvent inclure, mais ne sont pas limités à, des factures, des devis, des contraventions automobiles et bien plus encore.

                    Classifie le document : Tu dois déterminer le type de document. Par exemple, est-ce une facture, un devis, une contravention de voiture ou autre?

                    Extrais la date : Trouve la date d'envoi ou la date mentionnée sur le document.

                    Identifie l'entité ou la raison : S'agit-il d'une facture de Free? Dans ce cas, l'entité serait 'Free'. S'agit-il d'une contravention pour une infraction routière ? Dans ce cas, la raison serait 'voiture'.

                    Classement : Les documents seront automatiquement classés selon les informations extraites. Par exemple, une facture de Free datée du 20/12/2020 serait classée dans le répertoire 'Facture/Free/2020.txt'. Si le répertoire n'existe pas, il sera créé.

                    Extraction d'informations supplémentaires : Selon le type de document, il y a d'autres informations pertinentes à extraire. Par exemple, une facture ou une contravention pourrait nécessiter l'extraction du montant à payer et de la date limite de paiement. Si le document fournit un lien pour le paiement, un numéro de téléphone pour le service client, ou d'autres informations importantes, celles-ci doivent être également extraites.

                    Création d'événements Google Calendar : En fonction des informations extraites, un événement Google Calendar sera créé. Par exemple, pour une facture de Free qui nécessite un paiement de 30 euros le 12/12/2020, un événement sera créé avec les informations nécessaires.

                Ton rôle est crucial pour aider les personnes qui ont une phobie administrative.

                Format attendu de la réponse est sensé etre un dictionnaire tel que sur python si on fait eval(ton output) on a un dictionnaire de la forme:
                dict('doctype': [classification du document]
                'date': [date d'envoi du document]
                'entite_ou_raison': [entité qui a envoyé le document ou raison]
                'info_supplementaires': [toutes les informations pertinentes extraites du document)
                N'utilise surtout pas de guillemets dans tes mots si ce n'est pour formet un string python. Par exemple tu ecrira avec les mots comme s'appeler en tant que s_appeler
                En cas de doute ou si une information est inconnue, n'hésite pas à indiquer "N/A". Par exemple, entité: "N/A". 
                """ 
        else:
            self.prefix = prefix

        if suffix is None:
            self.suffix = """
                Input: {requête}
                Output:
                """
        else:
            self.suffix = suffix
        self.memory = ConversationBufferMemory(memory_key = "chat_history")
    
        self.set_few_shot_prompt_template()

        self.key_mapping = {
        "doctype" : "le type du document est: ",
        "date" : "la date d'envoie du document est: ",
        "entite_ou_raison" : "l'entité ou la raison qui a emis le document est: ",
        "info_supplementaires" : "les info supplementaires sont: "
        }
    
    def set_few_shot_prompt_template(self):
        self.few_shot_prompt_template = FewShotPromptTemplate(
                examples=self.example,
                example_prompt=self.example_prompt,
                prefix=self.prefix,
                suffix=self.suffix,
                input_variables=["requête"],
                # memory = self.memory, 
                example_separator="\n\n",
                # verbose = True
            )
    def call_gpt(self, text):
        llm = ChatOpenAI(temperature = 0, model_name = "gpt-3.5-turbo")
        chain = LLMChain(llm = llm, prompt = self.few_shot_prompt_template, verbose = False, memory = self.memory)
        response = chain.predict(requête=text)  
        i = 0
        while i<5:
            try: 
                response = eval(response)
                i=6
            except:
                response = chain.predict(requête="Je n'ai pas pu faire eval(ta réponse) il y'a surement un mauvais formatage, peux-tu corriger ton erreur")   
                i += 1
        if i==5:
            print("couldnt output right format")
            # sys.exit()
        return response 
    
    def json2semantic(self, output_json):
        """
        Take as input the output of chatgpt that which is supposed to be in dict format and output a 
        """
        vdb_output = ''
        for key1, value1 in output_json.items():
            if key1 in ["doc_id", "file_path"]:
                continue

            if key1 != "info_supplementaires":
                if value1 == "N/A":
                    continue
                else:
                    vdb_output += f'{self.key_mapping[key1]} "{value1}", '
            else:
                vdb_output += f'{self.key_mapping[key1]}'
                print(value1)
                for key2, value2 in json.loads(value1).items():
                    if value2 == "N/A":
                        continue
                    else:
                        vdb_output += f'{key2.replace("/"," ")} est "{value2}", ' 
        return vdb_output
    
chatgpt = ChatGpt(None, None, None, None, None)