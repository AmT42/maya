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
                        "requête" : '33337616255361 18\nV17.02.06.01.10020115 3761625536 ACO FRFR\nNuméro de l\'avis\nde contravention\n3761625536\nLiberté Égalité Fraternité\nRÉPUBLIQUE FRANÇAISE\nAVIS DE CONTRAVENTION\nwww.antal.gouv.fr est l\'unique site officiel habilité vous permettant de\nréaliser gratuitement toutes vos démarches en ligne dont les\ncontestations.\nMadame, Monsieur,\nLe véhicule dont le certificat d\'immatriculation est établi\nà votre nom a fait l\'objet d\'un contrôle ayant permis de\nconstater l\'infraction figurant ci-dessous.\nT5 v17 02\nDESCRIPTION DE L\'INFRACTION\nEXCES DE VITESSE\nEXCES DE VITESSE INFERIEUR A 20 KM/H PAR CONDUCTEUR DE VEHICULE A MOTEUR -\nVITESSE MAXIMALE AUTORISEE INFERIEURE OU EGALE A 50 KM/H\n- Prévue par Art. R. 413-14 §1 du C. de la route.\nRéprimée par Art. R. 413-14 §I al. 1 du C. de la route.\nDate/heure de constatation : le 15/06/2023 à 10h08\n75 av de la division leclerc\n.PK/PR: 000.000\nDirection sarcelles VERS montmorency\nSt brice sous forêt - 95350\nVotre véhicule a été contrôlé par un radar à la vitesse de 70 km/h, pour\nune vitesse limite autorisée de 50 km/h.\nCette infraction a été constatée et validée par un agent ou un officier\nde police judiciaire du Centre automatisé de constatation des\ninfractions routières (la vitesse retenue est de : 60 km/h).\nLA POSTE\nZA4\n110196 43927 8812\n1/ 31\nEffet(s) sur le permis de conduire\nCette infraction entraîne un retrait de 1 point(s) du permis de\nconduire. Une fois votre amende payée, vous recevrez un courrier du\nservice du Fichier national des permis de conduire vous informant de ce\nretrait de point.\nVOUS RECONNAISSEZ L\'INFRACTION\nVous devez payer l\'amende sur le site www.amendes.gouv.fr ou en\nutilisant les autres modes de paiement décrits dans le document «< Notice\nde paiement ».\nLe montant de l\'amende forfaitaire prévue pour cette infraction s\'élève à :\nLe paiement de l\'amende entraîne la reconnaissance de l\'infraction, le\nretrait éventuel de point(s) correspondant (articles 529 du Code de\nprocédure pénale et L223-1 du Code de la route).\nMontant de l\'amende\nSi vous payez dans les 15 jours à compter du 22/06/2023, le montant\nde votre amende est ramené à :\nCe délai est porté à 30 jours en cas de paiement sur internet, par serveur vocal,\nauprès d\'un buraliste ou partenaire agréé ou auprés des centres des finances\npubliques (uniquement par carte bancaire). Voir notice de paiement ci-jointe.\nCELEBI BAHAR\n58 RUE DE MARSEILLE\n93800 EPINAY SUR SEINE\nSi vous ne payez pas ou ne contestez pas dans les 45 jours à compter\ndu 22/06/2023, le montant de votre amende est majoré :\nDans ce cas, vous recevrez alors un "Avis d\'amende forfaitaire majorée" - art.\n529-2 du Code de procédure pénale.\n135 €\n90 €\n308\n375 €\nDate de l\'avis de\ncontravention\nX\n22/06/2023\nPays FRANCE\n. Marque RENAULT\n****\nIdentification du véhicule\nImmatriculation CY-747-JL\nSD 863021225190068\nAppareil de contrôle homologué\nType: MILLIA - GATSO - 201401000069\nDate de dernière vérification: 13/06/2023\nAgent verbalisateur\nAgent verbalisateur N° 471839\nService Centre automatisé de constatation des\ninfractions routières (Rennes)\nPour plus de renseignements sur cet avis, vos\ndémarches ou le suivi de votre dossier, consultez\nle site Internet www.antai.gouv.fr ou appelez le\n0806 606 606 (prix d\'un appel local),\nVOUS CONTESTEZ\nAVOIR COMMIS L\'INFRACTION\n1. Votre véhicule a été vendu / cédé / volé /\ndétruit ou vos plaques d\'immatriculation usurpées\n→n\'effectuez ni paiement ni consignation\n2. Un autre conducteur utilisait votre véhicule au\nmoment de l\'infraction\n→n\'effectuez ni paiement ni consignation\n..............\n3. Pour tout autre motif, vous devez verser une\nconsignation du montant de l\'amende forfaitaire.\n*********\nDans tous les cas, faites vos démarches en\nligne sur le site www.antai.gouv.fr ou complétez\nle formulaire joint et adressez votre requête par\nlettre recommandée avec demande d\'avis de\nréception à :\nL OFFICIER DU MINISTERE PUBLIC\nCONTESTATION VITESSE\nCS 41101\n35911 RENNES CEDEX 9\nJE',
                        "réponse" : "doctype: contravention, date: 22/06/2023, entite_ou_raison: voiture, recaputilatif: C'est une contravention   de voiture au nom de Celebi Bahar pour éxcès de vitesse inferieur à 20 km/h, la vitesse limite autorisé est de 50km/h. Si vous payez dans les 15 jours à compter du 22/06/2023 le montant est 90 euros sinon 135 euros. La deadline est donc le 06/06/2023/. La date de la contravention est le 15/06/2023 à 10h08 au 75 av de la division leclerc St brice sous forêt 95350. Le numero de contravention est 3761625536. Le site pour voir la contravention est www.anti.gouv.fr, deadline: 06/06/2023"
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
                    Agis comme un classifier et extracter d'informations de text de document.

                    Je vais te passer le text recuperé via un google ocr d'une photo de document  ta mission est de fonctionner comme un classificateur de documents et un extracteur d'informations pertinentes à partir de textes provenant de la reconnaissance optique de caractères (OCR) sur des images. Tu recevras différents types de documents textuels qui peuvent inclure, mais ne sont pas limités à, des factures, des devis, des contraventions automobiles et bien plus encore.

                    Classifie le document : Tu dois déterminer le type de document. Par exemple, est-ce une facture, un devis, une contravention de voiture ou autre?

                    Extrais la date : Trouve la date d'envoi ou la date mentionnée sur le document.

                    Identifie l'expediteur : S'agit-il d'une facture de Free? Dans ce cas, l'expediteur serait 'Free'. S'agit-il d'une contravention pour une infraction routière ? Dans ce cas, la raison serait 'Nom de la personne visé par la contravention'.

                    Classement : Les documents seront automatiquement classés selon les informations extraites. Par exemple, une facture de Free datée du 20/12/2020 serait classée dans le répertoire 'Facture/Free/2020.txt'. Si le répertoire n'existe pas, il sera créé.

                    Extraction d'informations supplémentaires : Selon le type de document, il y a d'autres informations pertinentes à extraire. Par exemple, une facture ou une contravention pourrait nécessiter l'extraction du montant à payer et de la date limite de paiement. Si le document fournit un lien pour le paiement, un numéro de téléphone pour le service client, ou d'autres informations importantes, celles-ci doivent être également extraites.

                    Création d'événements Google Calendar : En fonction des informations extraites, si il y'a une deadline, un événement Google Calendar sera créé. Par exemple, pour une facture de Free qui nécessite un paiement de 30 euros le 12/12/2020, un événement sera créé avec les informations nécessaires. Dans ton output il y'aura une clef google_calendar qui sera egale à None ou la date deadline en fonction de s'il y'a une deadline. Fais attention parfois il peut y avoir une deadline sans forcement qu'elle soit donné en brut. Par exemple cela peut etre: 2 semaine a compter du 01/01/2023 donc la deadline ici est 14/01/2023. Et parfois il sera ecrit "payer le plus rapidement possible" dans ce cas tu prends la date de reception et tu rajoute une semaine

                Ton rôle est crucial pour aider les personnes qui ont une phobie administrative.

                Format attendu de la réponse est sensé etre un dictionnaire tel que sur python si on fait eval(ton output) on a un dictionnaire de la forme:
                dict('doctype': [classification du document]
                'date': [date d'envoi du document],
                'expediteur' : [expediteur du document si c'est une contravention ca sera le destinataire]
                'recapitulatif': [Un recapitulatif du document qui servira plus tard pour une recherche semantinque]
                'google_calendar':[deadline qui est sensé etre dans 'recapitulatif' s'il y'en a une sinon None]
                Le format de la date est d/m/y, le format de tes outputs sauuf pour récapilatif devront être en miniscule sans accents pour faciliter le storage dans le bon directory. Utilise ton bon sens quand tu remplis les cases doctype c'est super important si on reçoit deux fois le même type de document il est primordiale d'avoir la bonne réponse pour savoir où ranger le document.
                N'utilise surtout pas de guillemets dans tes mots si ce n'est pour formet un string python. Par exemple tu ecrira avec les mots comme s'appeler en tant que s_appeler
                En cas de doute ou si une information est inconnue, n'hésite pas à indiquer "N/A". Par exemple, expediteur: "N/A". Surtout ton output devra être basé sur le text que tu reçois et non sur le text de l'example que je te fournis. 
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

        # self.key_mapping = {
        # "doctype" : "le type du document est: ",
        # "date" : "la date d'envoie du document est: ",
        # "entite_ou_raison" : "l'entité ou la raison qui a emis le document est: ",
        # "info_supplementaires" : "les info supplementaires sont: "
        # }
    
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
    
    # def json2semantic(self, output_json):
    #     """
    #     Take as input the output of chatgpt that which is supposed to be in dict format and output a 
    #     """
    #     vdb_output = ''
    #     for key1, value1 in output_json.items():
    #         if key1 in ["doc_id", "file_path"]:
    #             continue

    #         if key1 != "info_supplementaires":
    #             if value1 == "N/A":
    #                 continue
    #             else:
    #                 vdb_output += f'{self.key_mapping[key1]} "{value1}", '
    #         else:
    #             vdb_output += f'{self.key_mapping[key1]}'
    #             print(value1)
    #             for key2, value2 in value1.items():
    #                 if value2 == "N/A":
    #                     continue
    #                 else:
    #                     vdb_output += f'{key2.replace("/"," ")} est "{value2}", ' 
    #     return vdb_output
    
chatgpt = ChatGpt(None, None, None, None, None)