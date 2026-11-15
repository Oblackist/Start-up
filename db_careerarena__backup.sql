--
-- PostgreSQL database dump
--

\restrict l1YMYKEhEEkOrrdznE3ziYYqn34dXM8ekJeUXIfNFAXgrkgYQqjHzZtU6fEBb5u

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-11-15 04:26:30

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16660)
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    topic_id integer,
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_option character varying(1) NOT NULL,
    explanation text,
    CONSTRAINT questions_correct_option_check CHECK (((correct_option)::text = ANY ((ARRAY['A'::character varying, 'B'::character varying, 'C'::character varying, 'D'::character varying, 'E'::character varying])::text[])))
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16659)
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.questions_id_seq OWNER TO postgres;

--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 225
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- TOC entry 222 (class 1259 OID 16630)
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    id integer NOT NULL,
    subject_id integer,
    name character varying(100) NOT NULL
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16629)
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sections_id_seq OWNER TO postgres;

--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 221
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- TOC entry 220 (class 1259 OID 16619)
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16618)
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subjects_id_seq OWNER TO postgres;

--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 219
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- TOC entry 224 (class 1259 OID 16644)
-- Name: topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.topics (
    id integer NOT NULL,
    section_id integer,
    name character varying(100) NOT NULL,
    grade integer NOT NULL,
    CONSTRAINT topics_grade_check CHECK ((grade = ANY (ARRAY[9, 11])))
);


ALTER TABLE public.topics OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16643)
-- Name: topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.topics_id_seq OWNER TO postgres;

--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 223
-- Name: topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.topics_id_seq OWNED BY public.topics.id;


--
-- TOC entry 4874 (class 2604 OID 16663)
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- TOC entry 4872 (class 2604 OID 16633)
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- TOC entry 4871 (class 2604 OID 16622)
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- TOC entry 4873 (class 2604 OID 16647)
-- Name: topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics ALTER COLUMN id SET DEFAULT nextval('public.topics_id_seq'::regclass);


--
-- TOC entry 5044 (class 0 OID 16660)
-- Dependencies: 226
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.questions VALUES (13, 47, '... you ... a lot of money in the market last month?', '{"A": "Did, spend", "B": "Have, spent", "C": "Are, spending", "D": "Will, spend", "E": "Do, spend"}', 'A', NULL);
INSERT INTO public.questions VALUES (14, 47, 'My family ... a barbecue yesterday.', '{"A": "have", "B": "has", "C": "had", "D": "has had", "E": "is having"}', 'C', NULL);
INSERT INTO public.questions VALUES (15, 47, 'I ... a wonderful film in the cinema last night.', '{"A": "see", "B": "saw", "C": "have seen", "D": "don''t see", "E": "haven''t seen"}', 'B', NULL);
INSERT INTO public.questions VALUES (16, 47, 'The invited guests ... two hours ago.', '{"A": "will arrive", "B": "has arrived", "C": "is arriving", "D": "arrived", "E": "arrive"}', 'D', NULL);
INSERT INTO public.questions VALUES (17, 47, 'When Ben ... the room, he ... your present.', '{"A": "entered, will see", "B": "entered, has seen", "C": "will enter, sees", "D": "enters, will see", "E": "won''t enter, won''t see"}', 'D', NULL);
INSERT INTO public.questions VALUES (18, 47, 'A lot of money ... on pictures last Sunday.', '{"A": "are spent", "B": "was spent", "C": "were spent", "D": "is spent", "E": "will be spent"}', 'B', NULL);
INSERT INTO public.questions VALUES (19, 47, 'Our neighbours ... a month ago and we ... any information about them since.', '{"A": "have left, won''t have", "B": "have left, haven''t had", "C": "left, haven''t had", "D": "left, have had", "E": "have left, didn''t have"}', 'C', NULL);
INSERT INTO public.questions VALUES (20, 47, 'Yesterday my aunt ... a new watch.', '{"A": "buy", "B": "will buy", "C": "bought", "D": "is buying", "E": "has bought"}', 'C', NULL);
INSERT INTO public.questions VALUES (21, 47, 'He ... the top of the mountain before the sun ... .', '{"A": "reached, will rise", "B": "reached, has risen", "C": "will reach, will rise", "D": "will reach, rises", "E": "reach, rises"}', 'D', NULL);
INSERT INTO public.questions VALUES (22, 47, 'Mary ... told all the latest news when she ... to the office.', '{"A": "was, comes", "B": "will be, will come", "C": "was, came", "D": "were, came", "E": "is, will come"}', 'C', NULL);
INSERT INTO public.questions VALUES (23, 47, 'Susan usually ... lunch alone, but yesterday she ... lunch with her friends.', '{"A": "has, didn''t had", "B": "is having, had", "C": "has, had", "D": "had, has had", "E": "have, had"}', 'C', NULL);
INSERT INTO public.questions VALUES (24, 47, 'Our neighbour usually ... a walk in the morning, but yesterday he ... a walk in the evening.', '{"A": "is having, has had", "B": "is having, had", "C": "had, didn''t had", "D": "had, has had", "E": "has, had"}', 'E', NULL);
INSERT INTO public.questions VALUES (25, 47, 'What ... Betty ... for breakfast yesterday?', '{"A": "does, has", "B": "have, -", "C": "will, have", "D": "has, had", "E": "did, have"}', 'E', NULL);
INSERT INTO public.questions VALUES (26, 47, '... anyone ... while I was out?', '{"A": "Has, called", "B": "Did, call", "C": "Were, calling", "D": "Did, called", "E": "Does, calls"}', 'B', NULL);
INSERT INTO public.questions VALUES (27, 47, 'They ... no news from Sam since his departure.', '{"A": "will be heard", "B": "have heard", "C": "haven''t heard", "D": "hear", "E": "has heard"}', 'B', NULL);
INSERT INTO public.questions VALUES (28, 47, 'The fans ... at the stadium and the match ... .', '{"A": "have arrived, started", "B": "arrived, started", "C": "arrived, has started", "D": "will arrive, have started", "E": "arrive, start"}', 'B', NULL);
INSERT INTO public.questions VALUES (29, 47, 'When Tom ... at the station, his train ... .', '{"A": "has arrived, left", "B": "arrived, has left", "C": "will arrive, was leaving", "D": "will arrive, has left", "E": "arrived, was leaving"}', 'E', NULL);
INSERT INTO public.questions VALUES (30, 47, 'Mark ... tennis while his sister ... in the pool.', '{"A": "has played, was swimming", "B": "plays, swam", "C": "was playing, has swum", "D": "played, is swimming", "E": "was playing, was swimming"}', 'E', NULL);
INSERT INTO public.questions VALUES (31, 47, 'Tom ... a book while Martha ... TV.', '{"A": "has read, was watching", "B": "reads, watched", "C": "was reading, has watched", "D": "read, is watching", "E": "was reading, was watching"}', 'E', NULL);
INSERT INTO public.questions VALUES (32, 47, 'They ... for a walk when they ... their homework. 1. will go, finish 2. went, finished 3. will go, will finish 4. will go, finished 5. went, will finish', '{"A": "1, 2", "B": "2, 3, 4", "C": "4, 5", "D": "1, 3, 5", "E": "1, 4"}', 'A', NULL);
INSERT INTO public.questions VALUES (33, 47, 'Alan himself ... downstairs when he ... a knock at the door. 1. went, heard 2. will go, hears 3. will go, will hear 4. goes, will hear 5. goes, hears', '{"A": "1, 4, 5", "B": "2, 3, 4", "C": "3, 5", "D": "1, 3", "E": "1, 2, 5"}', 'E', NULL);
INSERT INTO public.questions VALUES (34, 47, 'When the manager ... Mr Dale a new job, he ... to accept it.', '{"A": "offers, refuse", "B": "will offer, will refuse", "C": "will offer, have refused", "D": "offered, refused", "E": "offered, has refused"}', 'D', NULL);
INSERT INTO public.questions VALUES (35, 47, 'David ... a book when his mother ... the room.', '{"A": "is reading, was entering", "B": "reads, enter", "C": "was reading, is entering", "D": "has read, entered", "E": "was reading, entered"}', 'E', NULL);
INSERT INTO public.questions VALUES (36, 47, 'The child ... when I ... the room.', '{"A": "is sleeping, left", "B": "sleeps, was leaving", "C": "has slept, have left", "D": "will sleep, will leave", "E": "was sleeping, left"}', 'E', NULL);
INSERT INTO public.questions VALUES (37, 47, 'We ... the new project when you phoned us.', '{"A": "were discussing", "B": "discuss", "C": "are discussing", "D": "have discussed", "E": "was discussing"}', 'A', NULL);
INSERT INTO public.questions VALUES (38, 47, '... you ... last summer in the country?', '{"A": "Did, spend", "B": "Do, spend", "C": "Will, spend", "D": "Have, spent", "E": "Did, spent"}', 'A', NULL);
INSERT INTO public.questions VALUES (39, 47, '... your children ... well last year?', '{"A": "Do, study", "B": "Did, studied", "C": "Did, study", "D": "Have, studied", "E": "Are, studying"}', 'C', NULL);
INSERT INTO public.questions VALUES (40, 47, 'Joseph ... all his debts next month.', '{"A": "will pay", "B": "has paid", "C": "pay", "D": "paid", "E": "was paying"}', 'A', NULL);
INSERT INTO public.questions VALUES (41, 47, 'Sophie ... in Ganja at 2 o''clock tomorrow.', '{"A": "has arrived", "B": "arrived", "C": "arrive", "D": "was arriving", "E": "will arrive"}', 'E', NULL);
INSERT INTO public.questions VALUES (42, 47, 'As soon as she ... any news, she will tell you about it.', '{"A": "will get", "B": "gets", "C": "was getting", "D": "got", "E": "get"}', 'B', NULL);
INSERT INTO public.questions VALUES (43, 47, 'Last week Mrs Taylor ... in her garden. She usually ... there on Sundays.', '{"A": "worked, is working", "B": "is working, works", "C": "will work, works", "D": "worked, works", "E": "works, works"}', 'D', NULL);
INSERT INTO public.questions VALUES (44, 47, 'The sun ... when the climber reached Mount Everest.', '{"A": "is shining", "B": "shines", "C": "shine", "D": "will shine", "E": "was shining"}', 'E', NULL);
INSERT INTO public.questions VALUES (45, 47, 'Mike usually ... his dog for a walk in the evenings.', '{"A": "take", "B": "is taking", "C": "takes", "D": "was taking", "E": "has taken"}', 'C', NULL);
INSERT INTO public.questions VALUES (46, 47, 'The visitors will come into the hall if the boss ... them.', '{"A": "will allow", "B": "allowed", "C": "won''t allow", "D": "allow", "E": "allows"}', 'E', NULL);
INSERT INTO public.questions VALUES (47, 47, 'Latin ... an international language some centuries ago, but today it ... a dead language.', '{"A": "is, has become", "B": "was, has become", "C": "was, become", "D": "is, will become", "E": "will be, is"}', 'B', NULL);
INSERT INTO public.questions VALUES (48, 47, 'People ... more taxes when they ... more money.', '{"A": "were paying, are earning", "B": "pay, earn", "C": "pay, will pay", "D": "have paid, earned", "E": "paid, earn"}', 'B', NULL);
INSERT INTO public.questions VALUES (49, 47, 'I ... play basketball when I was at school.', '{"A": "didn''t used to", "B": "use to", "C": "used to", "D": "used", "E": "didn''t use"}', 'C', NULL);
INSERT INTO public.questions VALUES (50, 47, 'I ... go to a lot of museums with my mum when I was a child.', '{"A": "didn''t used to", "B": "use to", "C": "used to", "D": "used", "E": "didn''t use"}', 'C', NULL);
INSERT INTO public.questions VALUES (51, 47, 'At the age of 10 I ... go dancing at weekends.', '{"A": "used to", "B": "use to", "C": "didn''t used to", "D": "used", "E": "didn''t use"}', 'A', NULL);
INSERT INTO public.questions VALUES (52, 47, '... you ... to come here when you were a child?', '{"A": "Don''t, use", "B": "Did, use", "C": "Did, used", "D": "Didn''t, used", "E": "Do, used"}', 'B', NULL);
INSERT INTO public.questions VALUES (53, 47, 'If Tom ... here, he''ll be late for the train.', '{"A": "waits", "B": "waited", "C": "won''t wait", "D": "wait", "E": "will wait"}', 'A', NULL);
INSERT INTO public.questions VALUES (54, 47, 'If he ... the money he earns, he will be able to go on a cruise.', '{"A": "won''t save", "B": "will save", "C": "saved", "D": "save", "E": "saves"}', 'E', NULL);
INSERT INTO public.questions VALUES (55, 47, 'If Nick ... on holiday this summer, he''ll travel to Istanbul.', '{"A": "won''t go", "B": "go", "C": "will go", "D": "went", "E": "goes"}', 'E', NULL);
INSERT INTO public.questions VALUES (56, 47, 'Mother will buy a new dress if she ... her own salary.', '{"A": "had", "B": "will have", "C": "has", "D": "have", "E": "is having"}', 'C', NULL);
INSERT INTO public.questions VALUES (57, 47, 'If you ... at four, you''ll arrive in Paris by the evening.', '{"A": "flew", "B": "won''t fly", "C": "fly", "D": "will fly", "E": "has flown"}', 'C', NULL);
INSERT INTO public.questions VALUES (58, 47, 'You ... safe in the car crash if you ... a seatbelt.', '{"A": "were, won''t wear", "B": "will be, wore", "C": "have been, will wear", "D": "are, will wear", "E": "will be, wear"}', 'E', NULL);
INSERT INTO public.questions VALUES (59, 51, 'We elect the President for a term of five years.', '{"A": "The President elects for a term of five years.", "B": "The President was elected for a term of five years.", "C": "The President is elected for a term of five years.", "D": "The President elected for a term of five years.", "E": "The President is been elected for a term of five years."}', 'C', NULL);
INSERT INTO public.questions VALUES (60, 51, 'A few pictures decorate the room.', '{"A": "The room decorated with a few pictures.", "B": "The room is decorated with a few pictures.", "C": "A few pictures are decorated the room.", "D": "A few pictures have decorated the room.", "E": "The room was decorated with a few pictures."}', 'B', NULL);
INSERT INTO public.questions VALUES (61, 51, 'Our pupils use computers at the lessons.', '{"A": "Computers are used by our pupils at the lessons.", "B": "Computers used by our pupils are at the lessons.", "C": "Computers have used by our pupils at the lessons.", "D": "Computers were used by our pupils at the lessons.", "E": "Computers are been used by our pupils at the lessons."}', 'A', NULL);
INSERT INTO public.questions VALUES (62, 51, 'The company accepted some new projects.', '{"A": "The company was been accepted some new projects.", "B": "Some new projects were been accepted by the company.", "C": "The company was accepted some new projects.", "D": "Some new projects were accepted by the company.", "E": "Some new projects are accepted by the company."}', 'D', NULL);
INSERT INTO public.questions VALUES (63, 51, 'Someone stole his suitcase a few days ago.', '{"A": "His suitcase was stolen a few days ago.", "B": "His suitcase has stolen by someone.", "C": "Someone was stolen his suitcase a few days ago.", "D": "His suitcase was been stolen by someone a few days ago.", "E": "His suitcase is stolen by someone."}', 'A', NULL);
INSERT INTO public.questions VALUES (64, 51, 'Alice wrote an essay yesterday.', '{"A": "Alice was written an essay yesterday.", "B": "An essay is written by Alice.", "C": "An essay was been written yesterday.", "D": "An essay wrote by Alice yesterday.", "E": "An essay was written yesterday."}', 'E', NULL);
INSERT INTO public.questions VALUES (65, 51, 'The students drew beautiful pictures.', '{"A": "Beautiful pictures drawn by the students.", "B": "Beautiful pictures were drawn by the students.", "C": "Beautiful pictures are been drawn by the students.", "D": "Beautiful pictures are drawn by the students.", "E": "The students were drawn beautiful pictures."}', 'B', NULL);
INSERT INTO public.questions VALUES (66, 51, 'The friends visit David every week.', '{"A": "David was visited by his friends every week.", "B": "The friends are visited by David every week.", "C": "David is visited by his friends every week.", "D": "David visits his friends every week.", "E": "The friends are visited David every week."}', 'C', NULL);
INSERT INTO public.questions VALUES (67, 51, 'The boy feeds the birds in the park every day.', '{"A": "The birds were fed in the park every day.", "B": "The birds are fed in the park every day.", "C": "The birds are been fed in the park.", "D": "The birds were fed them in the park every day.", "E": "The boy is fed the birds in the park every day."}', 'B', NULL);
INSERT INTO public.questions VALUES (68, 51, 'The company exported a lot of cotton last year.', '{"A": "The company is exported last year.", "B": "A lot of cotton was exported last year.", "C": "A lot of cotton exported last year.", "D": "A lot of cotton were exported last year.", "E": "The company was exported cotton last year."}', 'B', NULL);
INSERT INTO public.questions VALUES (69, 51, 'The hunters caught the bear in the forest.', '{"A": "The bear has caught by the hunters in the forest.", "B": "The bear was caught by the hunters in the forest.", "C": "The bear is caught by the hunters in the forest.", "D": "The hunters were caught the bear in the forest.", "E": "The bear was been caught by the hunters in the forest."}', 'B', NULL);
INSERT INTO public.questions VALUES (70, 51, 'Sophie taught economics at this University.', '{"A": "Sophie was taught economics at this University.", "B": "Economics is taught at this University.", "C": "Economics was been taught at this University.", "D": "Sophie is taught economics at this University.", "E": "Economics was taught at this University."}', 'E', NULL);
INSERT INTO public.questions VALUES (102, 49, 'They would have arrived on time if they ... the earlier train.', '{"A": "caught", "B": "catch", "C": "have caught", "D": "would catch", "E": "had caught"}', 'E', NULL);
INSERT INTO public.questions VALUES (71, 51, 'He drinks a cup of coffee every morning.', '{"A": "A cup of coffee is been drunk by him every morning.", "B": "A cup of coffee drinks by him every morning.", "C": "A cup of coffee was drunk by him every morning.", "D": "A cup of coffee is drunk by him every morning.", "E": "A cup of coffee has drunk by him every morning."}', 'D', NULL);
INSERT INTO public.questions VALUES (72, 51, 'The girl left the notes on the desk.', '{"A": "The notes were been left on the desk.", "B": "The girl was left the notes on the desk.", "C": "The notes have left on the desk.", "D": "The notes are left on the desk.", "E": "The notes were left on the desk."}', 'E', NULL);
INSERT INTO public.questions VALUES (73, 51, 'They will change the decision tomorrow.', '{"A": "The decision will change tomorrow by them.", "B": "The decision is changed by them tomorrow.", "C": "The decision will be changed tomorrow.", "D": "They will be changed the decision tomorrow.", "E": "The decision will change them tomorrow."}', 'C', NULL);
INSERT INTO public.questions VALUES (74, 51, 'Her message informed me about their arrival.', '{"A": "I was been informed about their arrival.", "B": "I am been informed about their arrival.", "C": "I am informed about their arrival.", "D": "I was informed about their arrival.", "E": "Her message was informed about their arrival."}', 'D', NULL);
INSERT INTO public.questions VALUES (75, 51, 'They sell all sorts of paper here.', '{"A": "All sorts of paper are sold here.", "B": "All sorts of paper have sold here.", "C": "All sorts of paper sold here.", "D": "All sorts of paper were sold here.", "E": "All sorts of paper are been sold here."}', 'A', NULL);
INSERT INTO public.questions VALUES (76, 51, 'She put some pieces of cake on the table.', '{"A": "Some pieces of cake were put on the table.", "B": "Some pieces of cake are been put on the table.", "C": "Some pieces of cake were been put on the table.", "D": "Some pieces of cake are put on the table.", "E": "Some pieces of cake put on the table."}', 'A', NULL);
INSERT INTO public.questions VALUES (77, 51, 'He read a few articles from the newspaper.', '{"A": "A few articles were been read from the newspaper.", "B": "A few articles read from the newspaper.", "C": "A few articles are read from the newspaper.", "D": "A few articles were read from the newspaper.", "E": "A few articles are been read from the newspaper."}', 'D', NULL);
INSERT INTO public.questions VALUES (78, 51, 'They planted the fields with cotton.', '{"A": "The fields have planted with cotton.", "B": "The fields were planted with cotton.", "C": "The fields are planted with cotton.", "D": "The fields were been planted with cotton.", "E": "The fields will be planted with cotton."}', 'B', NULL);
INSERT INTO public.questions VALUES (79, 51, 'The scientists discovered new facts.', '{"A": "New facts were been discovered by the scientists.", "B": "New facts have discovered by the scientists.", "C": "New facts are been discovered by the scientists.", "D": "New facts were discovered by the scientists.", "E": "New facts will be discovered by the scientists."}', 'D', NULL);
INSERT INTO public.questions VALUES (80, 51, 'We looked through all the advertisements very attentively.', '{"A": "All the advertisements are been looked through very attentively.", "B": "All the advertisements were looked through very attentively.", "C": "We were looked through all the advertisements very attentively.", "D": "All the advertisements were been looked through very attentively.", "E": "All the advertisements are looked through very attentively."}', 'B', NULL);
INSERT INTO public.questions VALUES (81, 51, 'They decorate the hall before Christmas.', '{"A": "The hall will be decorated before Christmas.", "B": "The hall was decorated before Christmas.", "C": "The hall is decorated before Christmas.", "D": "The hall is been decorated before Christmas.", "E": "They are decorated the hall before Christmas."}', 'C', NULL);
INSERT INTO public.questions VALUES (82, 51, 'They bought this house many years ago.', '{"A": "They were bought this house many years ago.", "B": "This house bought many years ago.", "C": "This house was bought many years ago.", "D": "This house is bought many years ago.", "E": "They were this house bought many years ago."}', 'C', NULL);
INSERT INTO public.questions VALUES (83, 51, 'Jane took the books from the library last Monday.', '{"A": "Jane were the books taken from the library last Monday.", "B": "The books are taken from the library last Monday.", "C": "The books have taken from the library last Monday.", "D": "Jane was taken books from the library last Monday.", "E": "The books were taken from the library last Monday."}', 'E', NULL);
INSERT INTO public.questions VALUES (84, 51, 'The fire damaged the town last year.', '{"A": "The town was damaged last year.", "B": "The fire was damaged the town last year.", "C": "The town were been damaged last year.", "D": "The fire was damaged last year.", "E": "The fire was been damaged last year."}', 'A', NULL);
INSERT INTO public.questions VALUES (85, 51, 'The servant cleaned all the windows.', '{"A": "All the windows are been cleaned by the servant.", "B": "All the windows have cleaned by the servant.", "C": "The servant was cleaned all the windows.", "D": "The servant has cleaned all the windows.", "E": "All the windows were cleaned by the servant."}', 'E', NULL);
INSERT INTO public.questions VALUES (86, 51, 'The fire destroyed the building.', '{"A": "The building was destroyed.", "B": "The building has destroyed by the fire.", "C": "The fire was destroyed the building.", "D": "The fire will be destroyed.", "E": "The building was been destroyed by the fire."}', 'A', NULL);
INSERT INTO public.questions VALUES (87, 49, 'If you heat ice, it ... .', '{"A": "melt", "B": "melts", "C": "will melt", "D": "melted", "E": "is melting"}', 'B', NULL);
INSERT INTO public.questions VALUES (88, 49, 'If it ... tomorrow, we will cancel the picnic.', '{"A": "will rain", "B": "rains", "C": "rained", "D": "is raining", "E": "rain"}', 'B', NULL);
INSERT INTO public.questions VALUES (89, 49, 'If I ... a million dollars, I would travel the world.', '{"A": "win", "B": "won", "C": "will win", "D": "have won", "E": "had won"}', 'B', NULL);
INSERT INTO public.questions VALUES (90, 49, 'If she ... harder, she would have passed the exam.', '{"A": "studies", "B": "studied", "C": "had studied", "D": "has studied", "E": "study"}', 'C', NULL);
INSERT INTO public.questions VALUES (91, 49, 'If I had gone to bed earlier, I ... so tired now.', '{"A": "won''t be", "B": "wouldn''t be", "C": "wouldn''t have been", "D": "am not", "E": "wasn''t"}', 'B', NULL);
INSERT INTO public.questions VALUES (92, 49, 'You won''t succeed ... you work hard.', '{"A": "if", "B": "unless", "C": "when", "D": "as long as", "E": "whether"}', 'B', NULL);
INSERT INTO public.questions VALUES (93, 49, 'What ... if you saw a ghost?', '{"A": "will you do", "B": "do you do", "C": "would you do", "D": "did you do", "E": "have you done"}', 'C', NULL);
INSERT INTO public.questions VALUES (94, 49, 'Plants die if they ... enough water.', '{"A": "don''t get", "B": "won''t get", "C": "didn''t get", "D": "aren''t getting", "E": "haven''t got"}', 'A', NULL);
INSERT INTO public.questions VALUES (95, 49, 'If we ... the map, we wouldn''t have got lost.', '{"A": "took", "B": "take", "C": "have taken", "D": "had taken", "E": "would take"}', 'D', NULL);
INSERT INTO public.questions VALUES (96, 49, 'I''ll call you as soon as I ... home.', '{"A": "get", "B": "will get", "C": "got", "D": "am getting", "E": "would get"}', 'A', NULL);
INSERT INTO public.questions VALUES (97, 49, 'If I ... you, I wouldn''t tell anyone.', '{"A": "am", "B": "was", "C": "were", "D": "will be", "E": "would be"}', 'C', NULL);
INSERT INTO public.questions VALUES (98, 49, 'If he ... the truth, he wouldn''t have lied.', '{"A": "knew", "B": "knows", "C": "has known", "D": "had known", "E": "would know"}', 'D', NULL);
INSERT INTO public.questions VALUES (99, 49, 'If I were you, I ... that car yesterday.', '{"A": "wouldn''t buy", "B": "didn''t buy", "C": "wouldn''t have bought", "D": "haven''t bought", "E": "won''t buy"}', 'C', NULL);
INSERT INTO public.questions VALUES (100, 49, 'If you see John, ... him to call me.', '{"A": "tell", "B": "will tell", "C": "telling", "D": "told", "E": "to tell"}', 'A', NULL);
INSERT INTO public.questions VALUES (101, 49, 'If I ... English better, I could work as a translator.', '{"A": "speak", "B": "spoke", "C": "will speak", "D": "had spoken", "E": "am speaking"}', 'B', NULL);
INSERT INTO public.questions VALUES (103, 49, 'If you mix red and yellow, you ... orange.', '{"A": "get", "B": "will get", "C": "got", "D": "would get", "E": "had got"}', 'A', NULL);
INSERT INTO public.questions VALUES (104, 49, 'Unless she ..., she will fail the test.', '{"A": "doesn''t study", "B": "studies", "C": "will study", "D": "won''t study", "E": "studied"}', 'B', NULL);
INSERT INTO public.questions VALUES (105, 49, 'If I had more time, I ... learn to play the piano.', '{"A": "will", "B": "would", "C": "can", "D": "did", "E": "had"}', 'B', NULL);
INSERT INTO public.questions VALUES (106, 49, 'If you ... me, I would have helped you.', '{"A": "asked", "B": "ask", "C": "had asked", "D": "would ask", "E": "have asked"}', 'C', NULL);
INSERT INTO public.questions VALUES (107, 49, 'If she had taken her medicine, she ... better today.', '{"A": "feels", "B": "will feel", "C": "would feel", "D": "would have felt", "E": "felt"}', 'C', NULL);
INSERT INTO public.questions VALUES (108, 49, 'If it doesn''t rain, we ... to the beach.', '{"A": "won''t go", "B": "will go", "C": "would go", "D": "went", "E": "go"}', 'B', NULL);
INSERT INTO public.questions VALUES (109, 49, 'If I ... so busy, I would come to your party.', '{"A": "am not", "B": "wasn''t", "C": "weren''t", "D": "won''t be", "E": "hadn''t been"}', 'C', NULL);
INSERT INTO public.questions VALUES (110, 49, 'If I had studied harder, I ... passed the exam.', '{"A": "could have", "B": "can have", "C": "will have", "D": "would", "E": "had"}', 'A', NULL);
INSERT INTO public.questions VALUES (111, 49, 'Which sentence is a Third Conditional?', '{"A": "If I win, I will share.", "B": "If I won, I would share.", "C": "If I had won, I would have shared.", "D": "If I win, I share.", "E": "If I am winning, I share."}', 'C', NULL);
INSERT INTO public.questions VALUES (112, 49, 'Take an umbrella ... it rains.', '{"A": "if", "B": "unless", "C": "in case", "D": "even if", "E": "provided that"}', 'C', NULL);
INSERT INTO public.questions VALUES (113, 49, 'What ... you do if you won the lottery?', '{"A": "will", "B": "would", "C": "do", "D": "did", "E": "have"}', 'B', NULL);
INSERT INTO public.questions VALUES (114, 49, 'If they ... the instructions, they wouldn''t have made a mistake.', '{"A": "followed", "B": "follow", "C": "had followed", "D": "have followed", "E": "would follow"}', 'C', NULL);
INSERT INTO public.questions VALUES (115, 49, 'If I had studied medicine, I ... a doctor now.', '{"A": "am", "B": "will be", "C": "would be", "D": "would have been", "E": "was"}', 'C', NULL);
INSERT INTO public.questions VALUES (116, 49, 'If you ... to fail, what would you do?', '{"A": "happen", "B": "happened", "C": "will happen", "D": "had happened", "E": "are happening"}', 'B', NULL);
INSERT INTO public.questions VALUES (117, NULL, 'Her ... to the project was invaluable.', '{"A": "contribute", "B": "contribution", "C": "contributing", "D": "contributive", "E": "contributor"}', 'B', NULL);
INSERT INTO public.questions VALUES (118, NULL, 'The ... of the building took three years.', '{"A": "construct", "B": "construction", "C": "constructive", "D": "constructor", "E": "constructing"}', 'B', NULL);
INSERT INTO public.questions VALUES (119, NULL, 'He is a very ... person; he always helps others.', '{"A": "care", "B": "careful", "C": "careless", "D": "caring", "E": "carelessly"}', 'D', NULL);
INSERT INTO public.questions VALUES (120, NULL, 'The teacher praised her for her ... in class.', '{"A": "participate", "B": "participation", "C": "participative", "D": "participant", "E": "participating"}', 'B', NULL);
INSERT INTO public.questions VALUES (121, NULL, 'The company decided to ... the old factory.', '{"A": "modern", "B": "modernize", "C": "modernization", "D": "modernly", "E": "modernity"}', 'B', NULL);
INSERT INTO public.questions VALUES (122, NULL, 'His ... behavior surprised everyone at the party.', '{"A": "child", "B": "childish", "C": "childhood", "D": "childishly", "E": "childlike"}', 'B', NULL);
INSERT INTO public.questions VALUES (123, NULL, 'The ... of the novel was unexpected.', '{"A": "popular", "B": "popularity", "C": "popularly", "D": "popularize", "E": "popularization"}', 'B', NULL);
INSERT INTO public.questions VALUES (124, NULL, 'We need to find a ... solution to this problem.', '{"A": "practice", "B": "practical", "C": "practically", "D": "practice", "E": "practicing"}', 'B', NULL);
INSERT INTO public.questions VALUES (125, NULL, 'Her ... of the situation was completely wrong.', '{"A": "understand", "B": "understanding", "C": "understandable", "D": "understandably", "E": "misunderstand"}', 'B', NULL);
INSERT INTO public.questions VALUES (126, NULL, 'The ... of the team depends on everyone''s effort.', '{"A": "succeed", "B": "success", "C": "successful", "D": "successfully", "E": "succeeding"}', 'B', NULL);
INSERT INTO public.questions VALUES (127, NULL, 'He spoke ... about his achievements.', '{"A": "proud", "B": "proudly", "C": "pride", "D": "proudness", "E": "prouder"}', 'B', NULL);
INSERT INTO public.questions VALUES (128, NULL, 'The ... of the river has increased over the years.', '{"A": "pollute", "B": "pollution", "C": "polluted", "D": "pollutant", "E": "polluting"}', 'B', NULL);
INSERT INTO public.questions VALUES (129, NULL, 'It was an ... experience for the whole family.', '{"A": "forget", "B": "forgetful", "C": "unforgettable", "D": "forgetfully", "E": "forgetting"}', 'C', NULL);
INSERT INTO public.questions VALUES (130, NULL, 'The scientist made an important ... .', '{"A": "discover", "B": "discovery", "C": "discoverable", "D": "discoverer", "E": "discovering"}', 'B', NULL);
INSERT INTO public.questions VALUES (131, NULL, 'She is known for her ... and kindness.', '{"A": "generous", "B": "generosity", "C": "generously", "D": "generousness", "E": "general"}', 'B', NULL);
INSERT INTO public.questions VALUES (132, NULL, 'The ... of the meeting has been changed.', '{"A": "arrange", "B": "arrangement", "C": "arranged", "D": "arranger", "E": "arranging"}', 'B', NULL);
INSERT INTO public.questions VALUES (133, NULL, 'He was ... injured in the accident.', '{"A": "serious", "B": "seriously", "C": "seriousness", "D": "serious", "E": "more serious"}', 'B', NULL);
INSERT INTO public.questions VALUES (134, NULL, 'The ... of the product was amazing.', '{"A": "develop", "B": "development", "C": "developing", "D": "developer", "E": "developed"}', 'B', NULL);
INSERT INTO public.questions VALUES (135, NULL, 'This medicine is very ... for headaches.', '{"A": "effect", "B": "effective", "C": "effectively", "D": "effectiveness", "E": "effected"}', 'B', NULL);
INSERT INTO public.questions VALUES (136, NULL, 'Her ... to detail is impressive.', '{"A": "attend", "B": "attention", "C": "attentive", "D": "attentively", "E": "attending"}', 'B', NULL);
INSERT INTO public.questions VALUES (137, NULL, 'The ... of the story is very interesting.', '{"A": "begin", "B": "beginning", "C": "beginner", "D": "begun", "E": "begins"}', 'B', NULL);
INSERT INTO public.questions VALUES (138, NULL, 'He is a ... speaker; everyone enjoys his speeches.', '{"A": "power", "B": "powerful", "C": "powerfully", "D": "powerlessness", "E": "powers"}', 'B', NULL);
INSERT INTO public.questions VALUES (139, NULL, 'The ... of the exam results was delayed.', '{"A": "announce", "B": "announcement", "C": "announced", "D": "announcer", "E": "announcing"}', 'B', NULL);
INSERT INTO public.questions VALUES (140, NULL, 'She looked at him ... .', '{"A": "anger", "B": "angry", "C": "angrily", "D": "angered", "E": "angriness"}', 'C', NULL);
INSERT INTO public.questions VALUES (141, NULL, 'The ... of the company was a difficult decision.', '{"A": "close", "B": "closure", "C": "closed", "D": "closely", "E": "closing"}', 'B', NULL);
INSERT INTO public.questions VALUES (142, NULL, 'His ... for music was obvious from an early age.', '{"A": "talented", "B": "talent", "C": "talentedly", "D": "talents", "E": "talentless"}', 'B', NULL);
INSERT INTO public.questions VALUES (143, NULL, 'The ... of the bridge was a great achievement.', '{"A": "build", "B": "building", "C": "builder", "D": "built", "E": "rebuild"}', 'B', NULL);
INSERT INTO public.questions VALUES (144, NULL, 'She gave a ... explanation of the theory.', '{"A": "clear", "B": "clearly", "C": "clearness", "D": "clarity", "E": "clearing"}', 'A', NULL);
INSERT INTO public.questions VALUES (145, NULL, 'The ... of the machine requires special training.', '{"A": "operate", "B": "operation", "C": "operator", "D": "operational", "E": "operating"}', 'B', NULL);
INSERT INTO public.questions VALUES (146, NULL, 'He is very ... about his future.', '{"A": "hope", "B": "hopeful", "C": "hopefully", "D": "hopeless", "E": "hopelessness"}', 'B', NULL);
INSERT INTO public.questions VALUES (147, NULL, 'The ... of the forest is a serious problem.', '{"A": "destroy", "B": "destruction", "C": "destructive", "D": "destroyer", "E": "destroying"}', 'B', NULL);
INSERT INTO public.questions VALUES (148, NULL, 'Her ... was noticed by all her colleagues.', '{"A": "absent", "B": "absence", "C": "absently", "D": "absentee", "E": "absenting"}', 'B', NULL);
INSERT INTO public.questions VALUES (149, 55, 'I need to ... my notes before the exam.', '{"A": "go over", "B": "go off", "C": "go out", "D": "go up", "E": "go by"}', 'A', NULL);
INSERT INTO public.questions VALUES (150, 55, 'The meeting was ... because of the storm.', '{"A": "put off", "B": "put on", "C": "put up", "D": "put out", "E": "put away"}', 'A', NULL);
INSERT INTO public.questions VALUES (151, 55, 'She ... her mother; they look identical.', '{"A": "takes after", "B": "takes off", "C": "takes up", "D": "takes in", "E": "takes over"}', 'A', NULL);
INSERT INTO public.questions VALUES (152, 55, 'Can you ... the word in the dictionary?', '{"A": "look after", "B": "look up", "C": "look for", "D": "look into", "E": "look out"}', 'B', NULL);
INSERT INTO public.questions VALUES (153, 55, 'The car ... on the highway yesterday.', '{"A": "broke down", "B": "broke out", "C": "broke in", "D": "broke up", "E": "broke off"}', 'A', NULL);
INSERT INTO public.questions VALUES (154, 55, 'I can''t ... the noise any longer.', '{"A": "put up with", "B": "put down", "C": "put off", "D": "put on", "E": "put out"}', 'A', NULL);
INSERT INTO public.questions VALUES (155, 55, 'He ... smoking last year.', '{"A": "gave up", "B": "gave in", "C": "gave out", "D": "gave away", "E": "gave back"}', 'A', NULL);
INSERT INTO public.questions VALUES (156, 55, 'We need to ... a plan for the weekend.', '{"A": "come up with", "B": "come across", "C": "come down with", "D": "come into", "E": "come over"}', 'A', NULL);
INSERT INTO public.questions VALUES (157, 55, 'The teacher ... the test papers to the students.', '{"A": "handed out", "B": "handed in", "C": "handed over", "D": "handed down", "E": "handed back"}', 'A', NULL);
INSERT INTO public.questions VALUES (158, 55, 'I ... an old friend at the mall yesterday.', '{"A": "ran into", "B": "ran out of", "C": "ran over", "D": "ran away", "E": "ran up"}', 'A', NULL);
INSERT INTO public.questions VALUES (159, 55, 'Please ... the lights before you leave.', '{"A": "turn off", "B": "turn on", "C": "turn up", "D": "turn down", "E": "turn over"}', 'A', NULL);
INSERT INTO public.questions VALUES (160, 55, 'The plane ... at 6 a.m. tomorrow.', '{"A": "takes off", "B": "takes on", "C": "takes up", "D": "takes in", "E": "takes over"}', 'A', NULL);
INSERT INTO public.questions VALUES (161, 55, 'She ... her grandmother while her parents were away.', '{"A": "looked after", "B": "looked for", "C": "looked up", "D": "looked into", "E": "looked out"}', 'A', NULL);
INSERT INTO public.questions VALUES (162, 55, 'We ... petrol on the way to the mountains.', '{"A": "ran out of", "B": "ran into", "C": "ran over", "D": "ran away", "E": "ran up"}', 'A', NULL);
INSERT INTO public.questions VALUES (163, 55, 'He ... the job offer because the salary was low.', '{"A": "turned down", "B": "turned up", "C": "turned on", "D": "turned off", "E": "turned over"}', 'A', NULL);
INSERT INTO public.questions VALUES (164, 55, 'The firefighters ... the fire quickly.', '{"A": "put out", "B": "put on", "C": "put off", "D": "put up", "E": "put away"}', 'A', NULL);
INSERT INTO public.questions VALUES (165, 55, 'I ... my homework before dinner.', '{"A": "handed in", "B": "handed out", "C": "handed over", "D": "handed down", "E": "handed back"}', 'A', NULL);
INSERT INTO public.questions VALUES (166, 55, 'She ... a beautiful dress at the shop.', '{"A": "came across", "B": "came up with", "C": "came down with", "D": "came into", "E": "came over"}', 'A', NULL);
INSERT INTO public.questions VALUES (167, 55, 'The children ... when their mother arrived.', '{"A": "ran up", "B": "ran into", "C": "ran out", "D": "ran over", "E": "ran away"}', 'A', NULL);
INSERT INTO public.questions VALUES (168, 55, 'Can you ... the volume? The music is too loud.', '{"A": "turn down", "B": "turn up", "C": "turn on", "D": "turn off", "E": "turn over"}', 'A', NULL);
INSERT INTO public.questions VALUES (169, 55, 'He ... his father''s business after he retired.', '{"A": "took over", "B": "took off", "C": "took after", "D": "took up", "E": "took in"}', 'A', NULL);
INSERT INTO public.questions VALUES (170, 55, 'The match was ... due to heavy rain.', '{"A": "called off", "B": "called on", "C": "called up", "D": "called for", "E": "called in"}', 'A', NULL);
INSERT INTO public.questions VALUES (171, 55, 'I ... my keys and couldn''t enter the house.', '{"A": "left behind", "B": "left out", "C": "left off", "D": "left over", "E": "left in"}', 'A', NULL);
INSERT INTO public.questions VALUES (172, 55, 'She ... the story to make it more interesting.', '{"A": "made up", "B": "made out", "C": "made off", "D": "made for", "E": "made over"}', 'A', NULL);
INSERT INTO public.questions VALUES (173, 55, 'We should ... the problem before it gets worse.', '{"A": "look into", "B": "look after", "C": "look up", "D": "look for", "E": "look out"}', 'A', NULL);
INSERT INTO public.questions VALUES (174, 55, 'The meeting was ... until next Monday.', '{"A": "put off", "B": "put on", "C": "put up", "D": "put out", "E": "put away"}', 'A', NULL);
INSERT INTO public.questions VALUES (175, 55, 'He ... his jacket and sat down.', '{"A": "took off", "B": "took on", "C": "took up", "D": "took in", "E": "took over"}', 'A', NULL);
INSERT INTO public.questions VALUES (176, 55, 'I can''t ... what he is saying.', '{"A": "make out", "B": "make up", "C": "make off", "D": "make for", "E": "make over"}', 'A', NULL);
INSERT INTO public.questions VALUES (177, 55, 'The company ... a new product last month.', '{"A": "brought out", "B": "brought up", "C": "brought in", "D": "brought about", "E": "brought back"}', 'A', NULL);
INSERT INTO public.questions VALUES (178, 55, 'She ... her younger brother when their parents were at work.', '{"A": "looked after", "B": "looked for", "C": "looked up", "D": "looked into", "E": "looked out"}', 'A', NULL);
INSERT INTO public.questions VALUES (179, 55, 'The car ... at the traffic lights.', '{"A": "broke down", "B": "broke out", "C": "broke in", "D": "broke up", "E": "broke off"}', 'A', NULL);
INSERT INTO public.questions VALUES (180, 55, 'He ... his shoes before entering the house.', '{"A": "took off", "B": "took on", "C": "took up", "D": "took in", "E": "took over"}', 'A', NULL);
INSERT INTO public.questions VALUES (181, 55, 'We need to ... the total cost of the trip.', '{"A": "work out", "B": "work up", "C": "work off", "D": "work on", "E": "work in"}', 'A', NULL);
INSERT INTO public.questions VALUES (182, 55, 'She ... the invitation because she was busy.', '{"A": "turned down", "B": "turned up", "C": "turned on", "D": "turned off", "E": "turned over"}', 'A', NULL);
INSERT INTO public.questions VALUES (183, 1, 'Aşağıdakılardan hansı həqiqi ədəd deyil?', '{"A": "-5", "B": "0", "C": "√2", "D": "√-4", "E": "3/7"}', 'D', NULL);
INSERT INTO public.questions VALUES (184, 1, '√49 + √16 cəmi neçədir?', '{"A": "7", "B": "9", "C": "11", "D": "13", "E": "15"}', 'C', NULL);
INSERT INTO public.questions VALUES (185, 1, 'Hansı ədəd irrasionaldır?', '{"A": "0.25", "B": "√9", "C": "√3", "D": "-2/3", "E": "0.(3)"}', 'C', NULL);
INSERT INTO public.questions VALUES (186, 1, '|-7| + |3| cəmi neçədir?', '{"A": "4", "B": "7", "C": "10", "D": "-10", "E": "-4"}', 'C', NULL);
INSERT INTO public.questions VALUES (187, 1, '√144 - √25 fərqi neçədir?', '{"A": "5", "B": "7", "C": "9", "D": "11", "E": "13"}', 'B', NULL);
INSERT INTO public.questions VALUES (188, 1, '2^3 · 2^4 hasilinin qiyməti neçədir?', '{"A": "2^7", "B": "2^12", "C": "4^7", "D": "2^1", "E": "4^12"}', 'A', NULL);
INSERT INTO public.questions VALUES (189, 1, '3/4 + 1/2 cəmi neçədir?', '{"A": "4/6", "B": "5/4", "C": "1/2", "D": "3/2", "E": "7/4"}', 'B', NULL);
INSERT INTO public.questions VALUES (190, 1, '(-3)^2 - (-2)^3 fərqi neçədir?', '{"A": "1", "B": "5", "C": "13", "D": "17", "E": "19"}', 'D', NULL);
INSERT INTO public.questions VALUES (191, 1, 'Hansı ədəd rasionaldır?', '{"A": "√2", "B": "π", "C": "0.25", "D": "√5", "E": "e"}', 'C', NULL);
INSERT INTO public.questions VALUES (192, 1, '√8 · √2 hasilinin qiyməti neçədir?', '{"A": "2", "B": "4", "C": "8", "D": "16", "E": "32"}', 'B', NULL);
INSERT INTO public.questions VALUES (193, 1, '|-15| - |8| fərqi neçədir?', '{"A": "7", "B": "-7", "C": "23", "D": "-23", "E": "0"}', 'A', NULL);
INSERT INTO public.questions VALUES (194, 1, '2/3 · 9/4 hasilinin qiyməti neçədir?', '{"A": "1/2", "B": "3/2", "C": "5/2", "D": "2/3", "E": "4/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (195, 1, 'Hansı ədəd təbii ədəd deyil?', '{"A": "0", "B": "1", "C": "2", "D": "3", "E": "4"}', 'A', NULL);
INSERT INTO public.questions VALUES (196, 1, '√81 + √0 cəmi neçədir?', '{"A": "0", "B": "9", "C": "18", "D": "81", "E": "90"}', 'B', NULL);
INSERT INTO public.questions VALUES (197, 1, '5^0 + 2^3 cəmi neçədir?', '{"A": "6", "B": "7", "C": "8", "D": "9", "E": "10"}', 'D', NULL);
INSERT INTO public.questions VALUES (311, 9, '90 ədədinin 10%-i neçədir?', '{"A": "3", "B": "6", "C": "9", "D": "10", "E": "18"}', 'C', NULL);
INSERT INTO public.questions VALUES (198, 1, '|-4| · |3| hasilinin qiyməti neçədir?', '{"A": "-12", "B": "12", "C": "7", "D": "-7", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (199, 1, '√50 + √2 cəmi hansı ifadəyə bərabərdir?', '{"A": "5√2", "B": "6√2", "C": "7√2", "D": "8√2", "E": "10√2"}', 'B', NULL);
INSERT INTO public.questions VALUES (200, 1, '5/6 - 1/3 fərqi neçədir?', '{"A": "1/6", "B": "1/3", "C": "1/2", "D": "2/3", "E": "5/6"}', 'C', NULL);
INSERT INTO public.questions VALUES (201, 1, '(-2)^3 qiyməti neçədir?', '{"A": "-8", "B": "8", "C": "-6", "D": "6", "E": "-4"}', 'A', NULL);
INSERT INTO public.questions VALUES (202, 1, '√121 - √64 fərqi neçədir?', '{"A": "1", "B": "3", "C": "5", "D": "7", "E": "9"}', 'B', NULL);
INSERT INTO public.questions VALUES (203, 1, 'Hansı ədəd tam ədəd deyil?', '{"A": "-3", "B": "0", "C": "2", "D": "1/2", "E": "5"}', 'D', NULL);
INSERT INTO public.questions VALUES (204, 1, '|0| + |-9| cəmi neçədir?', '{"A": "0", "B": "9", "C": "-9", "D": "18", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (205, 1, '√7 / √2 · √4 / √7 hasilinin qiyməti neçədir? (Qeyd: İfadə sadələşdirilib)', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "1/2"}', 'B', NULL);
INSERT INTO public.questions VALUES (206, 1, '√18 · √2 hasilinin qiyməti neçədir?', '{"A": "3", "B": "6", "C": "9", "D": "12", "E": "18"}', 'B', NULL);
INSERT INTO public.questions VALUES (207, 1, '3^(-2) qiyməti neçədir?', '{"A": "1/9", "B": "1/3", "C": "3", "D": "9", "E": "-9"}', 'A', NULL);
INSERT INTO public.questions VALUES (208, 1, '√169 - √0 fərqi neçədir?', '{"A": "0", "B": "13", "C": "26", "D": "169", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (209, 1, '1/2 + 1/3 + 1/6 cəmi neçədir?', '{"A": "1/2", "B": "2/3", "C": "1", "D": "3/2", "E": "2"}', 'C', NULL);
INSERT INTO public.questions VALUES (210, 1, '|-3| · |-4| hasilinin qiyməti neçədir?', '{"A": "-12", "B": "12", "C": "7", "D": "1", "E": "0"}', 'B', NULL);
INSERT INTO public.questions VALUES (211, 1, 'Hansı ədəd √36 ilə eyni deyil?', '{"A": "6", "B": "|6|", "C": "(-6)^2", "D": "√36", "E": "3^2 - 3"}', 'C', NULL);
INSERT INTO public.questions VALUES (212, 1, '4/5 ÷ 2/3 bölməsinin nəticəsi neçədir?', '{"A": "2/5", "B": "8/15", "C": "6/5", "D": "5/6", "E": "4/3"}', 'C', NULL);
INSERT INTO public.questions VALUES (213, 1, '(-1)^99 qiyməti neçədir?', '{"A": "-1", "B": "1", "C": "99", "D": "-99", "E": "0"}', 'A', NULL);
INSERT INTO public.questions VALUES (214, 1, '√0.25 + √0.09 cəmi neçədir?', '{"A": "0.4", "B": "0.5", "C": "0.8", "D": "0.9", "E": "1.0"}', 'C', NULL);
INSERT INTO public.questions VALUES (215, 1, '(3^4) / (3^2) nəticəsi neçədir?', '{"A": "3", "B": "6", "C": "9", "D": "27", "E": "81"}', 'C', NULL);
INSERT INTO public.questions VALUES (216, 1, '|-2.5| + |2.5| cəmi neçədir?', '{"A": "0", "B": "2.5", "C": "5", "D": "-5", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (217, 1, '√72 - √18 fərqi hansı ifadəyə bərabərdir?', '{"A": "3√2", "B": "4√2", "C": "5√2", "D": "6√2", "E": "2√2"}', 'A', NULL);
INSERT INTO public.questions VALUES (218, 1, 'Hansı ədəd həm rasional, həm də tam ədəddir?', '{"A": "√2", "B": "5/2", "C": "-4", "D": "π", "E": "√7"}', 'C', NULL);
INSERT INTO public.questions VALUES (219, 3, '3/4 + 1/4 cəmi neçədir?', '{"A": "1/2", "B": "4/8", "C": "1", "D": "3/8", "E": "2"}', 'C', NULL);
INSERT INTO public.questions VALUES (220, 3, '5/6 - 2/6 fərqi neçədir?', '{"A": "3/12", "B": "1/2", "C": "7/6", "D": "3/6", "E": "1/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (221, 3, '2/3 · 3/4 hasilinin qiyməti neçədir?', '{"A": "5/7", "B": "6/12", "C": "1/2", "D": "8/9", "E": "2/4"}', 'C', NULL);
INSERT INTO public.questions VALUES (222, 3, '1/2 ÷ 1/4 bölməsinin nəticəsi neçədir?', '{"A": "1/8", "B": "1/2", "C": "1", "D": "2", "E": "4"}', 'D', NULL);
INSERT INTO public.questions VALUES (223, 3, '7/8 kəsrindən 3/8 çıxdıqda nə qalır?', '{"A": "4/16", "B": "1/2", "C": "10/8", "D": "4/8", "E": "1/4"}', 'B', NULL);
INSERT INTO public.questions VALUES (224, 3, '2/5 + 1/5 cəmi neçədir?', '{"A": "3/10", "B": "3/5", "C": "1/5", "D": "2/10", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (225, 3, '3/7 · 7/3 hasilinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "21/21", "D": "6/10", "E": "3/7"}', 'B', NULL);
INSERT INTO public.questions VALUES (226, 3, '4/9 + 2/9 cəmi neçədir?', '{"A": "6/18", "B": "2/3", "C": "6/9", "D": "1/3", "E": "8/9"}', 'B', NULL);
INSERT INTO public.questions VALUES (227, 3, '5/8 - 1/8 fərqi neçədir?', '{"A": "4/16", "B": "1/2", "C": "6/8", "D": "4/8", "E": "1/4"}', 'B', NULL);
INSERT INTO public.questions VALUES (228, 3, '1/3 · 3 hasilinin qiyməti neçədir?', '{"A": "1/9", "B": "1", "C": "3", "D": "3/3", "E": "9"}', 'B', NULL);
INSERT INTO public.questions VALUES (229, 3, '6/7 - 2/7 fərqi neçədir?', '{"A": "4/14", "B": "4/7", "C": "8/7", "D": "2/7", "E": "1/2"}', 'B', NULL);
INSERT INTO public.questions VALUES (230, 3, '3/5 + 2/5 cəmi neçədir?', '{"A": "5/10", "B": "1", "C": "5/5", "D": "1/5", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (231, 3, '2/3 · 3/2 hasilinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "6/6", "D": "2/3", "E": "3/2"}', 'B', NULL);
INSERT INTO public.questions VALUES (232, 3, '4/5 ÷ 2 bölməsinin nəticəsi neçədir?', '{"A": "8/5", "B": "2/5", "C": "4/10", "D": "1/5", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (233, 3, '9/10 - 3/10 fərqi neçədir?', '{"A": "6/20", "B": "3/5", "C": "12/10", "D": "6/10", "E": "1/5"}', 'B', NULL);
INSERT INTO public.questions VALUES (234, 3, '1/4 + 1/4 + 1/4 cəmi neçədir?', '{"A": "3/12", "B": "1/4", "C": "3/4", "D": "1", "E": "2/4"}', 'C', NULL);
INSERT INTO public.questions VALUES (235, 3, '5/6 · 6/5 hasilinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "30/30", "D": "5/6", "E": "6/5"}', 'B', NULL);
INSERT INTO public.questions VALUES (236, 3, '7/9 - 4/9 fərqi neçədir?', '{"A": "3/18", "B": "1/3", "C": "11/9", "D": "3/9", "E": "1/2"}', 'B', NULL);
INSERT INTO public.questions VALUES (237, 3, '2/7 + 3/7 cəmi neçədir?', '{"A": "5/14", "B": "5/7", "C": "6/7", "D": "1/7", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (238, 3, '8/9 · 9/8 hasilinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "72/72", "D": "8/9", "E": "9/8"}', 'B', NULL);
INSERT INTO public.questions VALUES (239, 3, '1/2 + 1/2 cəmi neçədir?', '{"A": "2/4", "B": "1", "C": "1/4", "D": "2/2", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (240, 3, '3/4 · 4/3 hasilinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "12/12", "D": "3/4", "E": "4/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (241, 3, '5/9 - 2/9 fərqi neçədir?', '{"A": "3/18", "B": "1/3", "C": "7/9", "D": "3/9", "E": "1/2"}', 'B', NULL);
INSERT INTO public.questions VALUES (242, 3, '6/8 kəsrini sadələşdirin.', '{"A": "1/2", "B": "3/4", "C": "2/3", "D": "6/8", "E": "1/4"}', 'B', NULL);
INSERT INTO public.questions VALUES (243, 3, '10/15 kəsrini sadələşdirin.', '{"A": "1/2", "B": "2/3", "C": "3/4", "D": "5/10", "E": "1/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (244, 3, '4/6 kəsrini sadələşdirin.', '{"A": "1/2", "B": "2/3", "C": "3/4", "D": "4/6", "E": "1/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (245, 3, '9/12 kəsrini sadələşdirin.', '{"A": "1/2", "B": "2/3", "C": "3/4", "D": "9/12", "E": "1/3"}', 'C', NULL);
INSERT INTO public.questions VALUES (246, 3, '8/12 kəsrini sadələşdirin.', '{"A": "1/2", "B": "2/3", "C": "3/4", "D": "8/12", "E": "1/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (247, 3, '1/5 + 2/5 cəmi neçədir?', '{"A": "3/10", "B": "3/5", "C": "2/5", "D": "1/5", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (248, 3, '7/10 - 3/10 fərqi neçədir?', '{"A": "4/20", "B": "2/5", "C": "10/10", "D": "4/10", "E": "1/5"}', 'B', NULL);
INSERT INTO public.questions VALUES (249, 3, '3/8 · 8/3 hasilinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "24/24", "D": "3/8", "E": "8/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (250, 3, '2/3 ÷ 2/3 bölməsinin nəticəsi neçədir?', '{"A": "0", "B": "1", "C": "4/9", "D": "2/3", "E": "3/2"}', 'B', NULL);
INSERT INTO public.questions VALUES (251, 5, '2^3 ifadəsinin qiyməti neçədir?', '{"A": "5", "B": "6", "C": "8", "D": "9", "E": "12"}', 'C', NULL);
INSERT INTO public.questions VALUES (252, 5, '5^2 ifadəsinin qiyməti neçədir?', '{"A": "7", "B": "10", "C": "15", "D": "20", "E": "25"}', 'E', NULL);
INSERT INTO public.questions VALUES (253, 5, '10^0 ifadəsinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "10", "D": "100", "E": "Müəyyən deyil"}', 'B', NULL);
INSERT INTO public.questions VALUES (254, 5, 'a^m · a^n hasilini necə yazmaq olar?', '{"A": "a^(m+n)", "B": "a^(m-n)", "C": "a^(m·n)", "D": "a^(m/n)", "E": "a^n"}', 'A', NULL);
INSERT INTO public.questions VALUES (255, 5, 'a^m / a^n bölməsinin nəticəsi necə yazılır? (a ≠ 0)', '{"A": "a^(m+n)", "B": "a^(m-n)", "C": "a^(m·n)", "D": "a^(n-m)", "E": "a^m"}', 'B', NULL);
INSERT INTO public.questions VALUES (256, 5, '(a^m)^n ifadəsinin nəticəsi necə yazılır?', '{"A": "a^(m+n)", "B": "a^(m-n)", "C": "a^(m·n)", "D": "a^(m/n)", "E": "a^n"}', 'C', NULL);
INSERT INTO public.questions VALUES (257, 5, '3^4 ifadəsinin qiyməti neçədir?', '{"A": "12", "B": "27", "C": "64", "D": "81", "E": "243"}', 'D', NULL);
INSERT INTO public.questions VALUES (258, 5, '(-2)^2 ifadəsinin qiyməti neçədir?', '{"A": "-4", "B": "4", "C": "-2", "D": "2", "E": "0"}', 'B', NULL);
INSERT INTO public.questions VALUES (259, 5, '(-2)^3 ifadəsinin qiyməti neçədir?', '{"A": "-8", "B": "8", "C": "-6", "D": "6", "E": "-4"}', 'A', NULL);
INSERT INTO public.questions VALUES (260, 5, '2^4 · 2^3 hasilinin qiyməti neçədir?', '{"A": "2^7", "B": "2^12", "C": "4^7", "D": "2^1", "E": "4^12"}', 'A', NULL);
INSERT INTO public.questions VALUES (261, 5, '5^6 / 5^4 bölməsinin nəticəsi neçədir?', '{"A": "5^2", "B": "5^10", "C": "5^24", "D": "5^(-2)", "E": "5^1"}', 'A', NULL);
INSERT INTO public.questions VALUES (262, 5, '(3^2)^3 ifadəsinin nəticəsi neçədir?', '{"A": "3^5", "B": "3^6", "C": "3^8", "D": "3^9", "E": "3^12"}', 'B', NULL);
INSERT INTO public.questions VALUES (263, 5, '2^(-2) ifadəsinin qiyməti neçədir?', '{"A": "-4", "B": "-2", "C": "1/4", "D": "4", "E": "1/2"}', 'C', NULL);
INSERT INTO public.questions VALUES (264, 5, 'a^0 ifadəsinin qiyməti neçədir? (a ≠ 0)', '{"A": "0", "B": "1", "C": "a", "D": "-1", "E": "Müəyyən deyil"}', 'B', NULL);
INSERT INTO public.questions VALUES (265, 5, '1^100 ifadəsinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "100", "D": "-1", "E": "10"}', 'B', NULL);
INSERT INTO public.questions VALUES (266, 5, '0^5 ifadəsinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "5", "D": "-5", "E": "Müəyyən deyil"}', 'A', NULL);
INSERT INTO public.questions VALUES (267, 5, '7^1 ifadəsinin qiyməti neçədir?', '{"A": "0", "B": "1", "C": "7", "D": "14", "E": "49"}', 'C', NULL);
INSERT INTO public.questions VALUES (268, 5, '4^2 + 2^3 cəmi neçədir?', '{"A": "12", "B": "16", "C": "20", "D": "24", "E": "32"}', 'D', NULL);
INSERT INTO public.questions VALUES (269, 5, '3^3 - 2^3 fərqi neçədir?', '{"A": "1", "B": "3", "C": "9", "D": "19", "E": "27"}', 'D', NULL);
INSERT INTO public.questions VALUES (270, 5, '(a·b)^n ifadəsi necə yazılır?', '{"A": "a^n · b^n", "B": "a^n + b^n", "C": "a^n - b^n", "D": "a^n / b", "E": "a·b^n"}', 'A', NULL);
INSERT INTO public.questions VALUES (271, 5, '(a/b)^n ifadəsi necə yazılır? (b ≠ 0)', '{"A": "a^n / b^n", "B": "a / b^n", "C": "a^n / b", "D": "a^n · b^n", "E": "a/b · n"}', 'A', NULL);
INSERT INTO public.questions VALUES (272, 5, '2^5 ifadəsinin qiyməti neçədir?', '{"A": "10", "B": "16", "C": "25", "D": "32", "E": "64"}', 'D', NULL);
INSERT INTO public.questions VALUES (273, 5, '6^2 ifadəsinin qiyməti neçədir?', '{"A": "12", "B": "24", "C": "36", "D": "42", "E": "64"}', 'C', NULL);
INSERT INTO public.questions VALUES (274, 5, '(-1)^50 ifadəsinin qiyməti neçədir?', '{"A": "-1", "B": "1", "C": "0", "D": "50", "E": "-50"}', 'B', NULL);
INSERT INTO public.questions VALUES (275, 5, '(-1)^51 ifadəsinin qiyməti neçədir?', '{"A": "-1", "B": "1", "C": "0", "D": "51", "E": "-51"}', 'A', NULL);
INSERT INTO public.questions VALUES (276, 5, '10^3 ifadəsinin qiyməti neçədir?', '{"A": "30", "B": "100", "C": "300", "D": "1000", "E": "10000"}', 'D', NULL);
INSERT INTO public.questions VALUES (277, 5, 'x^2 · x^5 hasilini sadələşdirin.', '{"A": "x^10", "B": "x^7", "C": "x^3", "D": "x^(2/5)", "E": "2x^5"}', 'B', NULL);
INSERT INTO public.questions VALUES (278, 5, 'Hansı ifadə səhvdir?', '{"A": "a^m · a^n = a^(m+n)", "B": "(a^m)^n = a^(m·n)", "C": "a^0 = 1 (a ≠ 0)", "D": "a^(-n) = 1 / a^n", "E": "a^m + a^n = a^(m+n)"}', 'E', NULL);
INSERT INTO public.questions VALUES (279, 7, '|5| ifadəsinin qiyməti neçədir?', '{"A": "-5", "B": "0", "C": "5", "D": "10", "E": "25"}', 'C', NULL);
INSERT INTO public.questions VALUES (280, 7, '|-8| ifadəsinin qiyməti neçədir?', '{"A": "-8", "B": "0", "C": "8", "D": "16", "E": "-16"}', 'C', NULL);
INSERT INTO public.questions VALUES (281, 7, '|0| ifadəsinin qiyməti neçədir?', '{"A": "-1", "B": "0", "C": "1", "D": "2", "E": "Müəyyən deyil"}', 'B', NULL);
INSERT INTO public.questions VALUES (282, 7, '|-3| + |4| cəmi neçədir?', '{"A": "-7", "B": "-1", "C": "1", "D": "7", "E": "12"}', 'D', NULL);
INSERT INTO public.questions VALUES (283, 7, '|-10| - |6| fərqi neçədir?', '{"A": "-16", "B": "-4", "C": "4", "D": "16", "E": "60"}', 'C', NULL);
INSERT INTO public.questions VALUES (284, 7, '|7| · |-2| hasilinin qiyməti neçədir?', '{"A": "-14", "B": "-9", "C": "9", "D": "14", "E": "5"}', 'D', NULL);
INSERT INTO public.questions VALUES (285, 7, '|-20| / |4| bölməsinin nəticəsi neçədir?', '{"A": "-5", "B": "-4", "C": "4", "D": "5", "E": "80"}', 'D', NULL);
INSERT INTO public.questions VALUES (286, 7, 'Modulun tərifinə görə, |x| həmişə hansı qiyməti alır?', '{"A": "Yalnız müsbət", "B": "Yalnız mənfi", "C": "Mənfi və ya sıfır", "D": "Müsbət və ya sıfır", "E": "İstənilən ədəd"}', 'D', NULL);
INSERT INTO public.questions VALUES (287, 7, '|-15| ifadəsinin qiyməti neçədir?', '{"A": "-15", "B": "0", "C": "15", "D": "30", "E": "-30"}', 'C', NULL);
INSERT INTO public.questions VALUES (288, 7, '|9| - |-9| fərqi neçədir?', '{"A": "-18", "B": "-9", "C": "0", "D": "9", "E": "18"}', 'C', NULL);
INSERT INTO public.questions VALUES (289, 7, '|-4| · |3| hasilinin qiyməti neçədir?', '{"A": "-12", "B": "-7", "C": "7", "D": "12", "E": "1"}', 'D', NULL);
INSERT INTO public.questions VALUES (290, 7, '|2 - 7| ifadəsinin qiyməti neçədir?', '{"A": "-5", "B": "5", "C": "9", "D": "-9", "E": "14"}', 'B', NULL);
INSERT INTO public.questions VALUES (291, 7, '|3 - 8| + |2| cəmi neçədir?', '{"A": "3", "B": "5", "C": "7", "D": "9", "E": "13"}', 'C', NULL);
INSERT INTO public.questions VALUES (292, 7, 'Hansı bərabərlik həmişə doğrudur?', '{"A": "|x| = x", "B": "|-x| = -x", "C": "|-x| = |x|", "D": "|x| = -x", "E": "|x| + x = 0"}', 'C', NULL);
INSERT INTO public.questions VALUES (293, 7, '|-6| ÷ |2| bölməsinin nəticəsi neçədir?', '{"A": "-3", "B": "-2", "C": "2", "D": "3", "E": "12"}', 'D', NULL);
INSERT INTO public.questions VALUES (294, 7, '|-1| + |-2| + |-3| cəmi neçədir?', '{"A": "-6", "B": "0", "C": "3", "D": "6", "E": "9"}', 'D', NULL);
INSERT INTO public.questions VALUES (295, 7, '|0| · |5| hasilinin qiyməti neçədir?', '{"A": "-5", "B": "0", "C": "1", "D": "5", "E": "25"}', 'B', NULL);
INSERT INTO public.questions VALUES (296, 7, '|-12| - |3| fərqi neçədir?', '{"A": "-15", "B": "-9", "C": "9", "D": "15", "E": "36"}', 'C', NULL);
INSERT INTO public.questions VALUES (297, 7, '√(|-8|^2) ifadəsinin qiyməti neçədir?', '{"A": "-4", "B": "4", "C": "8", "D": "16", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (298, 7, '|5| + |-5| cəmi neçədir?', '{"A": "-10", "B": "-5", "C": "0", "D": "5", "E": "10"}', 'E', NULL);
INSERT INTO public.questions VALUES (299, 7, 'Hansı ədədin modulu özünə bərabər deyil?', '{"A": "3", "B": "0", "C": "-4", "D": "7", "E": "5"}', 'C', NULL);
INSERT INTO public.questions VALUES (300, 7, '|-9| · |0| hasilinin qiyməti neçədir?', '{"A": "-9", "B": "0", "C": "1", "D": "9", "E": "81"}', 'B', NULL);
INSERT INTO public.questions VALUES (301, 7, '|10 - 3| ifadəsinin qiyməti neçədir?', '{"A": "-7", "B": "7", "C": "13", "D": "-13", "E": "3"}', 'B', NULL);
INSERT INTO public.questions VALUES (302, 7, '|-2|^2 ifadəsinin qiyməti neçədir?', '{"A": "-4", "B": "-2", "C": "2", "D": "4", "E": "8"}', 'D', NULL);
INSERT INTO public.questions VALUES (303, 9, '200 ədədinin 15%-i neçədir?', '{"A": "15", "B": "20", "C": "25", "D": "30", "E": "35"}', 'D', NULL);
INSERT INTO public.questions VALUES (304, 9, '500 ədədinin 10%-i neçədir?', '{"A": "5", "B": "10", "C": "50", "D": "100", "E": "500"}', 'C', NULL);
INSERT INTO public.questions VALUES (305, 9, '80 ədədinin 25%-i neçədir?', '{"A": "10", "B": "15", "C": "20", "D": "25", "E": "40"}', 'C', NULL);
INSERT INTO public.questions VALUES (306, 9, '60 ədədinin 50%-i neçədir?', '{"A": "20", "B": "25", "C": "30", "D": "40", "E": "50"}', 'C', NULL);
INSERT INTO public.questions VALUES (307, 9, '400 ədədinin 5%-i neçədir?', '{"A": "5", "B": "10", "C": "20", "D": "40", "E": "50"}', 'C', NULL);
INSERT INTO public.questions VALUES (308, 9, '150 ədədinin 20%-i neçədir?', '{"A": "15", "B": "20", "C": "25", "D": "30", "E": "35"}', 'D', NULL);
INSERT INTO public.questions VALUES (309, 9, '120 ədədinin 75%-i neçədir?', '{"A": "60", "B": "75", "C": "80", "D": "90", "E": "100"}', 'D', NULL);
INSERT INTO public.questions VALUES (310, 9, '250 ədədinin 40%-i neçədir?', '{"A": "50", "B": "75", "C": "100", "D": "125", "E": "150"}', 'C', NULL);
INSERT INTO public.questions VALUES (312, 9, '300 ədədinin 30%-i neçədir?', '{"A": "30", "B": "60", "C": "90", "D": "100", "E": "120"}', 'C', NULL);
INSERT INTO public.questions VALUES (313, 9, '20 ədədi 100 ədədinin neçə faizidir?', '{"A": "10%", "B": "20%", "C": "25%", "D": "50%", "E": "80%"}', 'B', NULL);
INSERT INTO public.questions VALUES (314, 9, '15 ədədi 60 ədədinin neçə faizidir?', '{"A": "15%", "B": "20%", "C": "25%", "D": "30%", "E": "40%"}', 'C', NULL);
INSERT INTO public.questions VALUES (315, 9, '40 ədədi 200 ədədinin neçə faizidir?', '{"A": "10%", "B": "15%", "C": "20%", "D": "25%", "E": "40%"}', 'C', NULL);
INSERT INTO public.questions VALUES (316, 9, '25 ədədi 50 ədədinin neçə faizidir?', '{"A": "25%", "B": "40%", "C": "50%", "D": "75%", "E": "100%"}', 'C', NULL);
INSERT INTO public.questions VALUES (317, 9, '18 ədədi 90 ədədinin neçə faizidir?', '{"A": "10%", "B": "15%", "C": "18%", "D": "20%", "E": "25%"}', 'D', NULL);
INSERT INTO public.questions VALUES (318, 9, '12 ədədi 48 ədədinin neçə faizidir?', '{"A": "12%", "B": "20%", "C": "25%", "D": "30%", "E": "40%"}', 'C', NULL);
INSERT INTO public.questions VALUES (319, 9, '70 ədədi 140 ədədinin neçə faizidir?', '{"A": "25%", "B": "40%", "C": "50%", "D": "70%", "E": "100%"}', 'C', NULL);
INSERT INTO public.questions VALUES (320, 9, '45 ədədi 180 ədədinin neçə faizidir?', '{"A": "15%", "B": "20%", "C": "25%", "D": "30%", "E": "45%"}', 'C', NULL);
INSERT INTO public.questions VALUES (321, 9, '16 ədədi 80 ədədinin neçə faizidir?', '{"A": "10%", "B": "16%", "C": "20%", "D": "25%", "E": "30%"}', 'C', NULL);
INSERT INTO public.questions VALUES (322, 9, '24 ədədi 120 ədədinin neçə faizidir?', '{"A": "12%", "B": "20%", "C": "24%", "D": "25%", "E": "30%"}', 'B', NULL);
INSERT INTO public.questions VALUES (323, 9, 'Ədədin 20%-i 40-dır. Bu ədəd neçədir?', '{"A": "100", "B": "150", "C": "200", "D": "250", "E": "300"}', 'C', NULL);
INSERT INTO public.questions VALUES (324, 9, 'Ədədin 25%-i 15-dir. Bu ədəd neçədir?', '{"A": "30", "B": "45", "C": "60", "D": "75", "E": "90"}', 'C', NULL);
INSERT INTO public.questions VALUES (325, 9, 'Ədədin 10%-i 7-dir. Bu ədəd neçədir?', '{"A": "17", "B": "70", "C": "77", "D": "100", "E": "140"}', 'B', NULL);
INSERT INTO public.questions VALUES (326, 9, 'Ədədin 50%-i 35-dir. Bu ədəd neçədir?', '{"A": "50", "B": "60", "C": "70", "D": "75", "E": "80"}', 'C', NULL);
INSERT INTO public.questions VALUES (327, 9, 'Ədədin 40%-i 80-dir. Bu ədəd neçədir?', '{"A": "160", "B": "180", "C": "200", "D": "220", "E": "240"}', 'C', NULL);
INSERT INTO public.questions VALUES (328, 9, 'Ədədin 5%-i 9-dur. Bu ədəd neçədir?', '{"A": "45", "B": "90", "C": "135", "D": "180", "E": "200"}', 'D', NULL);
INSERT INTO public.questions VALUES (329, 9, '100 ədədini 20% artırsaq, nəticə neçə olar?', '{"A": "110", "B": "120", "C": "125", "D": "130", "E": "140"}', 'B', NULL);
INSERT INTO public.questions VALUES (330, 9, '200 ədədini 15% artırsaq, nəticə neçə olar?', '{"A": "215", "B": "220", "C": "225", "D": "230", "E": "240"}', 'D', NULL);
INSERT INTO public.questions VALUES (331, 9, '80 ədədini 25% artırsaq, nəticə neçə olar?', '{"A": "90", "B": "95", "C": "100", "D": "105", "E": "110"}', 'C', NULL);
INSERT INTO public.questions VALUES (332, 9, '150 ədədini 10% azaltsaq, nəticə neçə olar?', '{"A": "135", "B": "140", "C": "145", "D": "150", "E": "160"}', 'A', NULL);
INSERT INTO public.questions VALUES (333, 9, '400 ədədini 30% azaltsaq, nəticə neçə olar?', '{"A": "260", "B": "270", "C": "280", "D": "290", "E": "300"}', 'C', NULL);
INSERT INTO public.questions VALUES (334, 9, '60 ədədini 50% azaltsaq, nəticə neçə olar?', '{"A": "20", "B": "25", "C": "30", "D": "35", "E": "40"}', 'C', NULL);
INSERT INTO public.questions VALUES (335, 9, 'Bir məhsulun qiyməti 200 manatdır. Qiymət 10% artırıldıqdan sonra neçə manat olar?', '{"A": "210", "B": "215", "C": "220", "D": "225", "E": "230"}', 'C', NULL);
INSERT INTO public.questions VALUES (336, 9, 'Bir məhsulun qiyməti 500 manatdır. Qiymət 20% endirildikdən sonra neçə manat olar?', '{"A": "350", "B": "380", "C": "400", "D": "420", "E": "450"}', 'C', NULL);
INSERT INTO public.questions VALUES (337, 9, '1000 manat banka illik 10% faizlə qoyuldu. 1 il sonra nə qədər faiz gəliri olar?', '{"A": "10", "B": "50", "C": "100", "D": "150", "E": "200"}', 'C', NULL);
INSERT INTO public.questions VALUES (338, 9, '2000 manat banka illik 5% faizlə qoyuldu. 1 il sonra ümumi məbləğ (əsas + faiz) neçə manat olar?', '{"A": "2050", "B": "2100", "C": "2150", "D": "2200", "E": "2500"}', 'B', NULL);
INSERT INTO public.questions VALUES (339, 9, '300 manatlıq mal 15% endirimlə satılır. Endirim məbləği neçə manatdır?', '{"A": "30", "B": "40", "C": "45", "D": "50", "E": "60"}', 'C', NULL);
INSERT INTO public.questions VALUES (340, 9, 'Bir sinifdə 40 şagirdin 60%-i qızdır. Oğlanların sayı neçədir?', '{"A": "12", "B": "14", "C": "16", "D": "18", "E": "24"}', 'C', NULL);
INSERT INTO public.questions VALUES (341, 11, 'Tənlik nədir?', '{"A": "Yalnız ədədlərdən ibarət ifadə", "B": "Tərəfləri bərabər işarəsi ilə birləşdirilmiş iki ifadə", "C": "Yalnız hərflərdən ibarət ifadə", "D": "Həmişə doğru olan bərabərlik", "E": "Həmişə yanlış olan bərabərlik"}', 'B', NULL);
INSERT INTO public.questions VALUES (342, 11, 'x + 5 = 10 tənliyinin kökü neçədir?', '{"A": "2", "B": "3", "C": "4", "D": "5", "E": "15"}', 'D', NULL);
INSERT INTO public.questions VALUES (343, 11, 'x - 3 = 7 tənliyinin kökü neçədir?', '{"A": "4", "B": "7", "C": "10", "D": "3", "E": "-10"}', 'C', NULL);
INSERT INTO public.questions VALUES (344, 11, '2x = 8 tənliyinin kökü neçədir?', '{"A": "2", "B": "4", "C": "6", "D": "8", "E": "16"}', 'B', NULL);
INSERT INTO public.questions VALUES (345, 11, 'x/3 = 4 tənliyinin kökü neçədir?', '{"A": "1", "B": "7", "C": "12", "D": "3", "E": "4"}', 'C', NULL);
INSERT INTO public.questions VALUES (346, 11, 'x + 7 = 7 tənliyinin kökü neçədir?', '{"A": "7", "B": "14", "C": "0", "D": "-7", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (347, 11, 'x - 4 = 0 tənliyinin kökü neçədir?', '{"A": "0", "B": "-4", "C": "4", "D": "8", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (348, 11, '3x = 9 tənliyinin kökü neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "6", "E": "27"}', 'C', NULL);
INSERT INTO public.questions VALUES (349, 11, 'x + 1 = 5 tənliyinin kökü neçədir?', '{"A": "1", "B": "2", "C": "4", "D": "5", "E": "6"}', 'C', NULL);
INSERT INTO public.questions VALUES (350, 11, '10 - x = 6 tənliyinin kökü neçədir?', '{"A": "2", "B": "4", "C": "6", "D": "10", "E": "16"}', 'B', NULL);
INSERT INTO public.questions VALUES (351, 11, 'Tənliyin kökü (həlli) nədir?', '{"A": "Tənliyin sol tərəfi", "B": "Tənliyin sağ tərəfi", "C": "Dəyişənin tənliyi doğru edən qiyməti", "D": "Tənlikdəki əmsallar", "E": "Tənlikdəki sərbəst hədd"}', 'C', NULL);
INSERT INTO public.questions VALUES (352, 11, 'x + 9 = 12 tənliyinin kökü neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "21"}', 'C', NULL);
INSERT INTO public.questions VALUES (353, 11, 'x - 8 = 2 tənliyinin kökü neçədir?', '{"A": "6", "B": "8", "C": "10", "D": "-6", "E": "16"}', 'C', NULL);
INSERT INTO public.questions VALUES (354, 11, '4x = 20 tənliyinin kökü neçədir?', '{"A": "4", "B": "5", "C": "16", "D": "20", "E": "80"}', 'B', NULL);
INSERT INTO public.questions VALUES (355, 11, 'x/5 = 2 tənliyinin kökü neçədir?', '{"A": "3", "B": "5", "C": "7", "D": "10", "E": "25"}', 'D', NULL);
INSERT INTO public.questions VALUES (356, 11, 'x + 0 = 8 tənliyinin kökü neçədir?', '{"A": "0", "B": "-8", "C": "8", "D": "16", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (357, 11, 'x - 10 = 5 tənliyinin kökü neçədir?', '{"A": "5", "B": "10", "C": "15", "D": "-5", "E": "50"}', 'C', NULL);
INSERT INTO public.questions VALUES (358, 11, '2x + 1 = 7 tənliyinin kökü neçədir?', '{"A": "2", "B": "3", "C": "4", "D": "6", "E": "8"}', 'B', NULL);
INSERT INTO public.questions VALUES (359, 11, '3x - 3 = 6 tənliyinin kökü neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "9"}', 'C', NULL);
INSERT INTO public.questions VALUES (360, 11, 'x + 2 = 2 tənliyinin kökü neçədir?', '{"A": "2", "B": "4", "C": "0", "D": "-2", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (361, 11, 'Bərabərliyin hər iki tərəfinə eyni ədədi əlavə etsək, bərabərlik necə olar?', '{"A": "Pozular", "B": "Dəyişməz", "C": "Doğru olar", "D": "Yanlış olar", "E": "Sıfır olar"}', 'B', NULL);
INSERT INTO public.questions VALUES (362, 11, '5x = 0 tənliyinin kökü neçədir?', '{"A": "5", "B": "1", "C": "0", "D": "-5", "E": "10"}', 'C', NULL);
INSERT INTO public.questions VALUES (363, 11, 'x + 6 = 13 tənliyinin kökü neçədir?', '{"A": "5", "B": "6", "C": "7", "D": "19", "E": "13"}', 'C', NULL);
INSERT INTO public.questions VALUES (364, 11, 'x - 1 = 1 tənliyinin kökü neçədir?', '{"A": "0", "B": "1", "C": "2", "D": "-2", "E": "3"}', 'C', NULL);
INSERT INTO public.questions VALUES (365, 11, '6x = 18 tənliyinin kökü neçədir?', '{"A": "2", "B": "3", "C": "6", "D": "12", "E": "24"}', 'B', NULL);
INSERT INTO public.questions VALUES (366, 11, 'x/4 = 1 tənliyinin kökü neçədir?', '{"A": "1", "B": "2", "C": "4", "D": "8", "E": "0"}', 'C', NULL);
INSERT INTO public.questions VALUES (367, 11, 'x + 10 = 20 tənliyinin kökü neçədir?', '{"A": "5", "B": "10", "C": "20", "D": "30", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (368, 11, 'x - 6 = 4 tənliyinin kökü neçədir?', '{"A": "2", "B": "4", "C": "6", "D": "10", "E": "-10"}', 'D', NULL);
INSERT INTO public.questions VALUES (369, 11, 'x + 3 = 8 tənliyinin kökü neçədir?', '{"A": "3", "B": "5", "C": "8", "D": "11", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (370, 11, '7x = 7 tənliyinin kökü neçədir?', '{"A": "0", "B": "1", "C": "7", "D": "14", "E": "49"}', 'B', NULL);
INSERT INTO public.questions VALUES (371, 11, 'x - 2 = 8 tənliyinin kökü neçədir?', '{"A": "6", "B": "8", "C": "10", "D": "-6", "E": "4"}', 'C', NULL);
INSERT INTO public.questions VALUES (372, 11, 'x + 12 = 15 tənliyinin kökü neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "27"}', 'C', NULL);
INSERT INTO public.questions VALUES (373, 11, '2x = 10 tənliyinin kökü neçədir?', '{"A": "2", "B": "5", "C": "8", "D": "10", "E": "20"}', 'B', NULL);
INSERT INTO public.questions VALUES (374, 11, 'x - 5 = 5 tənliyinin kökü neçədir?', '{"A": "0", "B": "5", "C": "10", "D": "15", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (375, 11, 'x + 4 = 9 tənliyinin kökü neçədir?', '{"A": "4", "B": "5", "C": "9", "D": "13", "E": "3"}', 'B', NULL);
INSERT INTO public.questions VALUES (376, 11, 'x/2 = 6 tənliyinin kökü neçədir?', '{"A": "3", "B": "6", "C": "8", "D": "12", "E": "4"}', 'D', NULL);
INSERT INTO public.questions VALUES (377, 11, 'Tənliyi həll etmək nə deməkdir?', '{"A": "Onu yazmaq", "B": "Onun kökünü tapmaq", "C": "Onu silmək", "D": "Onu dəyişmək", "E": "Onu çoxaltmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (378, 11, 'x - 0 = 9 tənliyinin kökü neçədir?', '{"A": "0", "B": "9", "C": "-9", "D": "90", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (379, 11, '3x + 2 = 11 tənliyinin kökü neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'C', NULL);
INSERT INTO public.questions VALUES (380, 11, 'x + 15 = 15 tənliyinin kökü neçədir?', '{"A": "15", "B": "30", "C": "0", "D": "-15", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (381, 13, 'Tənliklər sistemi nədir?', '{"A": "Bir tənlik", "B": "İki və ya daha çox tənliyin birlikdə verilməsi", "C": "Yalnız ədədlər çoxluğu", "D": "Bir dəyişənli tənlik", "E": "Bərabərsizlik"}', 'B', NULL);
INSERT INTO public.questions VALUES (382, 13, 'Aşağıdakılardan hansı tənliklər sistemidir?', '{"A": "x + 2 = 5", "B": "2x = 10", "C": "x + y = 5 və x - y = 1", "D": "3x - 1 = 0", "E": "x^2 = 4"}', 'C', NULL);
INSERT INTO public.questions VALUES (383, 13, 'Tənliklər sisteminin həlli nədir?', '{"A": "Sistemdəki tənliklərin sayı", "B": "Hər iki tənliyi eyni vaxtda ödəyən qiymətlər cütü", "C": "Yalnız bir tənliyi ödəyən qiymət", "D": "Sistemdəki dəyişənlərin sayı", "E": "Sistemin yazılışı"}', 'B', NULL);
INSERT INTO public.questions VALUES (384, 13, 'x + y = 5 və x - y = 1 sisteminin həlli hansıdır?', '{"A": "x = 2, y = 3", "B": "x = 3, y = 2", "C": "x = 1, y = 4", "D": "x = 4, y = 1", "E": "x = 5, y = 0"}', 'B', NULL);
INSERT INTO public.questions VALUES (385, 13, 'x + y = 7 və x - y = 3 sisteminin həlli hansıdır?', '{"A": "x = 4, y = 3", "B": "x = 5, y = 2", "C": "x = 3, y = 4", "D": "x = 6, y = 1", "E": "x = 7, y = 0"}', 'B', NULL);
INSERT INTO public.questions VALUES (386, 13, 'x + y = 10 və x = y sisteminin həlli hansıdır?', '{"A": "x = 5, y = 5", "B": "x = 10, y = 0", "C": "x = 0, y = 10", "D": "x = 2, y = 8", "E": "x = 4, y = 6"}', 'A', NULL);
INSERT INTO public.questions VALUES (387, 13, '2x = 8 və y = 3 sisteminin həlli hansıdır?', '{"A": "x = 4, y = 3", "B": "x = 8, y = 3", "C": "x = 2, y = 3", "D": "x = 3, y = 4", "E": "x = 4, y = 8"}', 'A', NULL);
INSERT INTO public.questions VALUES (388, 13, 'x + y = 6 və x - y = 0 sisteminin həlli hansıdır?', '{"A": "x = 3, y = 3", "B": "x = 6, y = 0", "C": "x = 0, y = 6", "D": "x = 2, y = 4", "E": "x = 4, y = 2"}', 'A', NULL);
INSERT INTO public.questions VALUES (389, 13, 'x + y = 4 və y = 1 sisteminin həlli hansıdır?', '{"A": "x = 3, y = 1", "B": "x = 1, y = 3", "C": "x = 4, y = 1", "D": "x = 2, y = 1", "E": "x = 5, y = 1"}', 'A', NULL);
INSERT INTO public.questions VALUES (390, 13, 'x = 2 və y = 5 olarsa, x + y neçədir?', '{"A": "2", "B": "5", "C": "7", "D": "10", "E": "3"}', 'C', NULL);
INSERT INTO public.questions VALUES (391, 13, 'Tənliklər sistemini həll etmək nə deməkdir?', '{"A": "Tənlikləri yazmaq", "B": "Sistemin həllini (kökünü) tapmaq", "C": "Tənlikləri silmək", "D": "Dəyişənləri dəyişmək", "E": "Tənlikləri çoxaltmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (392, 13, 'x + y = 8 və x - y = 2 sisteminin həlli hansıdır?', '{"A": "x = 5, y = 3", "B": "x = 3, y = 5", "C": "x = 4, y = 4", "D": "x = 6, y = 2", "E": "x = 8, y = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (393, 13, 'x - y = 4 və y = 2 sisteminin həlli hansıdır?', '{"A": "x = 6, y = 2", "B": "x = 2, y = 6", "C": "x = 4, y = 2", "D": "x = 2, y = 4", "E": "x = 5, y = 2"}', 'A', NULL);
INSERT INTO public.questions VALUES (394, 13, 'x + y = 3 və x - y = 1 sisteminin həlli hansıdır?', '{"A": "x = 2, y = 1", "B": "x = 1, y = 2", "C": "x = 3, y = 0", "D": "x = 0, y = 3", "E": "x = 2, y = 2"}', 'A', NULL);
INSERT INTO public.questions VALUES (395, 13, '2x + y = 7 və y = 1 sisteminin həlli hansıdır?', '{"A": "x = 3, y = 1", "B": "x = 1, y = 3", "C": "x = 2, y = 1", "D": "x = 4, y = 1", "E": "x = 5, y = 1"}', 'A', NULL);
INSERT INTO public.questions VALUES (396, 13, 'x = 4 və y = 2 olarsa, x - y neçədir?', '{"A": "2", "B": "4", "C": "6", "D": "8", "E": "1"}', 'A', NULL);
INSERT INTO public.questions VALUES (397, 13, 'x + y = 9 və x - y = 5 sisteminin həlli hansıdır?', '{"A": "x = 7, y = 2", "B": "x = 2, y = 7", "C": "x = 5, y = 4", "D": "x = 4, y = 5", "E": "x = 9, y = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (398, 13, 'x + y = 5 və y = 2 sisteminin həlli hansıdır?', '{"A": "x = 3, y = 2", "B": "x = 2, y = 3", "C": "x = 5, y = 2", "D": "x = 1, y = 2", "E": "x = 4, y = 2"}', 'A', NULL);
INSERT INTO public.questions VALUES (399, 13, '3x = 9 və y = 4 sisteminin həlli hansıdır?', '{"A": "x = 3, y = 4", "B": "x = 4, y = 3", "C": "x = 9, y = 4", "D": "x = 2, y = 4", "E": "x = 3, y = 9"}', 'A', NULL);
INSERT INTO public.questions VALUES (400, 13, 'x + y = 2 və x - y = 2 sisteminin həlli hansıdır?', '{"A": "x = 2, y = 0", "B": "x = 0, y = 2", "C": "x = 1, y = 1", "D": "x = 2, y = 2", "E": "x = 0, y = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (401, 13, 'Tənliklər sistemində neçə dəyişən ola bilər?', '{"A": "Yalnız 1", "B": "Yalnız 2", "C": "İki və daha çox", "D": "Heç biri", "E": "Yalnız 3"}', 'C', NULL);
INSERT INTO public.questions VALUES (402, 13, 'x - y = 1 və y = 3 sisteminin həlli hansıdır?', '{"A": "x = 4, y = 3", "B": "x = 3, y = 4", "C": "x = 1, y = 3", "D": "x = 2, y = 3", "E": "x = 5, y = 3"}', 'A', NULL);
INSERT INTO public.questions VALUES (403, 13, 'x + y = 6 və x = 2 sisteminin həlli hansıdır?', '{"A": "x = 2, y = 4", "B": "x = 4, y = 2", "C": "x = 2, y = 6", "D": "x = 6, y = 2", "E": "x = 2, y = 2"}', 'A', NULL);
INSERT INTO public.questions VALUES (404, 13, '2x = 4 və 2y = 6 sisteminin həlli hansıdır?', '{"A": "x = 2, y = 3", "B": "x = 3, y = 2", "C": "x = 4, y = 6", "D": "x = 1, y = 3", "E": "x = 2, y = 6"}', 'A', NULL);
INSERT INTO public.questions VALUES (405, 13, 'x + y = 11 və x - y = 1 sisteminin həlli hansıdır?', '{"A": "x = 6, y = 5", "B": "x = 5, y = 6", "C": "x = 11, y = 0", "D": "x = 6, y = 6", "E": "x = 4, y = 7"}', 'A', NULL);
INSERT INTO public.questions VALUES (406, 13, 'x - y = 0 və x + y = 4 sisteminin həlli hansıdır?', '{"A": "x = 2, y = 2", "B": "x = 4, y = 0", "C": "x = 0, y = 4", "D": "x = 1, y = 3", "E": "x = 3, y = 1"}', 'A', NULL);
INSERT INTO public.questions VALUES (407, 13, 'Sistemin həlli olmadıqda nə baş verir?', '{"A": "Tənliklər üst-üstə düşür", "B": "Tənliklər paraleldir, kəsişmir", "C": "Tənliklər eynidir", "D": "Həll sonsuzdur", "E": "Həll birdir"}', 'B', NULL);
INSERT INTO public.questions VALUES (408, 13, 'x + y = 7 və y = 4 sisteminin həlli hansıdır?', '{"A": "x = 3, y = 4", "B": "x = 4, y = 3", "C": "x = 7, y = 4", "D": "x = 2, y = 4", "E": "x = 5, y = 4"}', 'A', NULL);
INSERT INTO public.questions VALUES (409, 13, 'x = 1 və y = 6 olarsa, x + y neçədir?', '{"A": "1", "B": "6", "C": "7", "D": "5", "E": "12"}', 'C', NULL);
INSERT INTO public.questions VALUES (410, 13, 'x + y = 5 və x - y = 3 sisteminin həlli hansıdır?', '{"A": "x = 4, y = 1", "B": "x = 1, y = 4", "C": "x = 3, y = 2", "D": "x = 2, y = 3", "E": "x = 5, y = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (411, 13, '3x + y = 10 və y = 4 sisteminin həlli hansıdır?', '{"A": "x = 2, y = 4", "B": "x = 4, y = 2", "C": "x = 3, y = 4", "D": "x = 1, y = 4", "E": "x = 5, y = 4"}', 'A', NULL);
INSERT INTO public.questions VALUES (412, 13, 'x + y = 8 və x = 8 sisteminin həlli hansıdır?', '{"A": "x = 8, y = 0", "B": "x = 0, y = 8", "C": "x = 8, y = 8", "D": "x = 4, y = 4", "E": "x = 2, y = 6"}', 'A', NULL);
INSERT INTO public.questions VALUES (413, 13, 'x - y = 2 və x = 5 sisteminin həlli hansıdır?', '{"A": "x = 5, y = 3", "B": "x = 3, y = 5", "C": "x = 5, y = 2", "D": "x = 2, y = 5", "E": "x = 5, y = 7"}', 'A', NULL);
INSERT INTO public.questions VALUES (414, 13, 'x + y = 12 və x - y = 4 sisteminin həlli hansıdır?', '{"A": "x = 8, y = 4", "B": "x = 4, y = 8", "C": "x = 6, y = 6", "D": "x = 10, y = 2", "E": "x = 7, y = 5"}', 'A', NULL);
INSERT INTO public.questions VALUES (415, 13, 'x + y = 1 və x - y = 1 sisteminin həlli hansıdır?', '{"A": "x = 1, y = 0", "B": "x = 0, y = 1", "C": "x = 1, y = 1", "D": "x = 0, y = 0", "E": "x = 2, y = -1"}', 'A', NULL);
INSERT INTO public.questions VALUES (416, 13, 'x = 3 və y = 3 olarsa, x · y neçədir?', '{"A": "6", "B": "3", "C": "9", "D": "12", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (417, 13, 'x + y = 4 və x - y = 2 sisteminin həlli hansıdır?', '{"A": "x = 3, y = 1", "B": "x = 1, y = 3", "C": "x = 2, y = 2", "D": "x = 4, y = 0", "E": "x = 0, y = 4"}', 'A', NULL);
INSERT INTO public.questions VALUES (418, 13, '2x = 6 və y = 1 sisteminin həlli hansıdır?', '{"A": "x = 3, y = 1", "B": "x = 1, y = 3", "C": "x = 6, y = 1", "D": "x = 2, y = 1", "E": "x = 3, y = 6"}', 'A', NULL);
INSERT INTO public.questions VALUES (419, 13, 'x - y = 3 və y = 1 sisteminin həlli hansıdır?', '{"A": "x = 4, y = 1", "B": "x = 1, y = 4", "C": "x = 3, y = 1", "D": "x = 2, y = 1", "E": "x = 5, y = 1"}', 'A', NULL);
INSERT INTO public.questions VALUES (420, 13, 'x + y = 10 və x - y = 0 sisteminin həlli hansıdır?', '{"A": "x = 5, y = 5", "B": "x = 10, y = 0", "C": "x = 0, y = 10", "D": "x = 4, y = 6", "E": "x = 6, y = 4"}', 'A', NULL);
INSERT INTO public.questions VALUES (421, 13, 'x + y = 6 və x - y = 4 sisteminin həlli hansıdır?', '{"A": "x = 5, y = 1", "B": "x = 1, y = 5", "C": "x = 4, y = 2", "D": "x = 2, y = 4", "E": "x = 3, y = 3"}', 'A', NULL);
INSERT INTO public.questions VALUES (422, 13, 'x + y = 15 və x - y = 5 sisteminin həlli hansıdır?', '{"A": "x = 10, y = 5", "B": "x = 5, y = 10", "C": "x = 15, y = 0", "D": "x = 7, y = 8", "E": "x = 12, y = 3"}', 'A', NULL);
INSERT INTO public.questions VALUES (423, 15, 'Kvadrat tənlik nədir?', '{"A": "Dərəcəsi 1 olan tənlik", "B": "Dərəcəsi 2 olan tənlik", "C": "Dərəcəsi 3 olan tənlik", "D": "Dərəcəsi 0 olan tənlik", "E": "Dərəcəsi 4 olan tənlik"}', 'B', NULL);
INSERT INTO public.questions VALUES (424, 15, 'Kvadrat tənliyin ümumi şəkli hansıdır? (a ≠ 0)', '{"A": "ax + b = 0", "B": "ax^2 + bx + c = 0", "C": "ax^3 + bx^2 + c = 0", "D": "ax^2 + b = 0", "E": "a + b = 0"}', 'B', NULL);
INSERT INTO public.questions VALUES (425, 15, 'x^2 - 9 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 3", "B": "x = -3", "C": "x = 3 və x = -3", "D": "x = 9", "E": "x = 0"}', 'C', NULL);
INSERT INTO public.questions VALUES (426, 15, 'x^2 = 16 tənliyinin kökləri hansılardır?', '{"A": "x = 4", "B": "x = -4", "C": "x = 4 və x = -4", "D": "x = 16", "E": "x = 8"}', 'C', NULL);
INSERT INTO public.questions VALUES (427, 15, 'x^2 = 25 tənliyinin kökləri hansılardır?', '{"A": "x = 5", "B": "x = -5", "C": "x = 5 və x = -5", "D": "x = 25", "E": "x = 0"}', 'C', NULL);
INSERT INTO public.questions VALUES (428, 15, 'x^2 - 4 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 2", "B": "x = -2", "C": "x = 2 və x = -2", "D": "x = 4", "E": "x = 0"}', 'C', NULL);
INSERT INTO public.questions VALUES (429, 15, 'x^2 = 1 tənliyinin kökləri hansılardır?', '{"A": "x = 1", "B": "x = -1", "C": "x = 1 və x = -1", "D": "x = 0", "E": "x = 2"}', 'C', NULL);
INSERT INTO public.questions VALUES (430, 15, 'x^2 - 36 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 6", "B": "x = -6", "C": "x = 6 və x = -6", "D": "x = 36", "E": "x = 18"}', 'C', NULL);
INSERT INTO public.questions VALUES (431, 15, 'x^2 = 0 tənliyinin kökü neçədir?', '{"A": "x = 0", "B": "x = 1", "C": "x = -1", "D": "Kök yoxdur", "E": "x = 2"}', 'A', NULL);
INSERT INTO public.questions VALUES (432, 15, 'x^2 + 1 = 0 tənliyinin həqiqi kökü varmı?', '{"A": "Bəli, x = 1", "B": "Bəli, x = -1", "C": "Bəli, x = 1 və x = -1", "D": "Xeyr, həqiqi kökü yoxdur", "E": "Bəli, x = 0"}', 'D', NULL);
INSERT INTO public.questions VALUES (433, 15, 'x^2 - 5x = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 0 və x = 5", "B": "x = 5", "C": "x = 0", "D": "x = 5 və x = -5", "E": "x = 1 və x = 5"}', 'A', NULL);
INSERT INTO public.questions VALUES (434, 15, 'x^2 + 3x = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 0 və x = -3", "B": "x = 3", "C": "x = 0", "D": "x = 3 və x = -3", "E": "x = 1 və x = -3"}', 'A', NULL);
INSERT INTO public.questions VALUES (435, 15, 'x^2 - 2x = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 0 və x = 2", "B": "x = 2", "C": "x = 0", "D": "x = 2 və x = -2", "E": "x = 1 və x = 2"}', 'A', NULL);
INSERT INTO public.questions VALUES (436, 15, 'x^2 - x = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 0 və x = 1", "B": "x = 1", "C": "x = 0", "D": "x = 1 və x = -1", "E": "x = 2 və x = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (437, 15, 'x^2 - 4x = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 0 və x = 4", "B": "x = 4", "C": "x = 0", "D": "x = 4 və x = -4", "E": "x = 2 və x = 4"}', 'A', NULL);
INSERT INTO public.questions VALUES (438, 15, 'x^2 + x = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 0 və x = -1", "B": "x = -1", "C": "x = 0", "D": "x = 1 və x = -1", "E": "x = 0 və x = 1"}', 'A', NULL);
INSERT INTO public.questions VALUES (439, 15, 'x^2 - 6x = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 0 və x = 6", "B": "x = 6", "C": "x = 0", "D": "x = 6 və x = -6", "E": "x = 3 və x = 6"}', 'A', NULL);
INSERT INTO public.questions VALUES (440, 15, 'Kvadrat tənliyin diskriminantı hansı düsturla tapılır?', '{"A": "D = b^2 - 4ac", "B": "D = b^2 + 4ac", "C": "D = a^2 - 4bc", "D": "D = c^2 - 4ab", "E": "D = b - 4ac"}', 'A', NULL);
INSERT INTO public.questions VALUES (441, 15, 'x^2 - 3x + 2 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 1 və x = 2", "B": "x = -1 və x = -2", "C": "x = 1 və x = -2", "D": "x = -1 və x = 2", "E": "x = 0 və x = 2"}', 'A', NULL);
INSERT INTO public.questions VALUES (442, 15, 'x^2 - 5x + 6 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 2 və x = 3", "B": "x = -2 və x = -3", "C": "x = 2 və x = -3", "D": "x = -2 və x = 3", "E": "x = 1 və x = 6"}', 'A', NULL);
INSERT INTO public.questions VALUES (443, 15, 'x^2 - 7x + 10 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 2 və x = 5", "B": "x = -2 və x = -5", "C": "x = 2 və x = -5", "D": "x = -2 və x = 5", "E": "x = 1 və x = 10"}', 'A', NULL);
INSERT INTO public.questions VALUES (444, 15, 'x^2 - 4x + 3 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 1 və x = 3", "B": "x = -1 və x = -3", "C": "x = 1 və x = -3", "D": "x = -1 və x = 3", "E": "x = 0 və x = 3"}', 'A', NULL);
INSERT INTO public.questions VALUES (445, 15, 'x^2 - 9x + 20 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 4 və x = 5", "B": "x = -4 və x = -5", "C": "x = 4 və x = -5", "D": "x = -4 və x = 5", "E": "x = 2 və x = 10"}', 'A', NULL);
INSERT INTO public.questions VALUES (446, 15, 'x^2 - 6x + 8 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 2 və x = 4", "B": "x = -2 və x = -4", "C": "x = 2 və x = -4", "D": "x = -2 və x = 4", "E": "x = 1 və x = 8"}', 'A', NULL);
INSERT INTO public.questions VALUES (447, 15, 'x^2 - 8x + 15 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 3 və x = 5", "B": "x = -3 və x = -5", "C": "x = 3 və x = -5", "D": "x = -3 və x = 5", "E": "x = 1 və x = 15"}', 'A', NULL);
INSERT INTO public.questions VALUES (448, 15, 'x^2 - 10x + 21 = 0 tənliyinin kökləri hansılardır?', '{"A": "x = 3 və x = 7", "B": "x = -3 və x = -7", "C": "x = 3 və x = -7", "D": "x = -3 və x = 7", "E": "x = 1 və x = 21"}', 'A', NULL);
INSERT INTO public.questions VALUES (449, 15, 'x^2 - 2x + 1 = 0 tənliyinin kökü neçədir?', '{"A": "x = 1 (ikiqat kök)", "B": "x = -1", "C": "x = 2", "D": "Kök yoxdur", "E": "x = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (450, 15, 'x^2 + 2x + 1 = 0 tənliyinin kökü neçədir?', '{"A": "x = -1 (ikiqat kök)", "B": "x = 1", "C": "x = 2", "D": "Kök yoxdur", "E": "x = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (451, 15, 'x^2 - 6x + 9 = 0 tənliyinin kökü neçədir?', '{"A": "x = 3 (ikiqat kök)", "B": "x = -3", "C": "x = 6", "D": "Kök yoxdur", "E": "x = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (452, 15, 'x^2 - 4x + 4 = 0 tənliyinin kökü neçədir?', '{"A": "x = 2 (ikiqat kök)", "B": "x = -2", "C": "x = 4", "D": "Kök yoxdur", "E": "x = 0"}', 'A', NULL);
INSERT INTO public.questions VALUES (453, 15, 'Əgər diskriminant D > 0 olarsa, kvadrat tənliyin neçə həqiqi kökü olar?', '{"A": "0", "B": "1", "C": "2", "D": "3", "E": "4"}', 'C', NULL);
INSERT INTO public.questions VALUES (454, 15, 'Əgər diskriminant D = 0 olarsa, kvadrat tənliyin neçə həqiqi kökü olar?', '{"A": "0", "B": "1 (ikiqat kök)", "C": "2", "D": "3", "E": "4"}', 'B', NULL);
INSERT INTO public.questions VALUES (455, 15, 'Əgər diskriminant D < 0 olarsa, kvadrat tənliyin neçə həqiqi kökü olar?', '{"A": "0", "B": "1", "C": "2", "D": "3", "E": "4"}', 'A', NULL);
INSERT INTO public.questions VALUES (456, 15, 'x^2 - 3x + 2 = 0 tənliyinin diskriminantı neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'A', NULL);
INSERT INTO public.questions VALUES (457, 15, 'x^2 - 5x + 6 = 0 tənliyinin diskriminantı neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'A', NULL);
INSERT INTO public.questions VALUES (458, 15, 'x^2 - 4x + 3 = 0 tənliyinin diskriminantı neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'D', NULL);
INSERT INTO public.questions VALUES (459, 17, 'Ədədi proqresiya (AP) nədir?', '{"A": "Hər növbəti həddi əvvəlkinə eyni ədədi vurmaqla alınan ardıcıllıq", "B": "Hər növbəti həddi əvvəlkinə eyni ədədi əlavə etməklə alınan ardıcıllıq", "C": "Hədləri arasında heç bir qanunauyğunluq olmayan ardıcıllıq", "D": "Yalnız müsbət ədədlərdən ibarət ardıcıllıq", "E": "Yalnız mənfi ədədlərdən ibarət ardıcıllıq"}', 'B', NULL);
INSERT INTO public.questions VALUES (460, 17, 'Həndəsi proqresiya (GP) nədir?', '{"A": "Hər növbəti həddi əvvəlkinə eyni ədədi əlavə etməklə alınan ardıcıllıq", "B": "Hər növbəti həddi əvvəlkinə eyni ədədi vurmaqla alınan ardıcıllıq", "C": "Hədləri arasında heç bir qanunauyğunluq olmayan ardıcıllıq", "D": "Yalnız tam ədədlərdən ibarət ardıcıllıq", "E": "Yalnız kəsr ədədlərdən ibarət ardıcıllıq"}', 'B', NULL);
INSERT INTO public.questions VALUES (461, 17, 'Ədədi proqresiyada qonşu hədlərin fərqinə nə deyilir?', '{"A": "Vuruq", "B": "Əmsal", "C": "Fərq (d)", "D": "Cəm", "E": "Hasil"}', 'C', NULL);
INSERT INTO public.questions VALUES (462, 17, 'Həndəsi proqresiyada qonşu hədlərin nisbətinə nə deyilir?', '{"A": "Fərq", "B": "Vuruq (q)", "C": "Cəm", "D": "Hasil", "E": "Əmsal"}', 'B', NULL);
INSERT INTO public.questions VALUES (463, 17, '2, 4, 6, 8, ... ardıcıllığı hansı proqresiyadır?', '{"A": "Həndəsi proqresiya", "B": "Ədədi proqresiya", "C": "Nə AP, nə də GP", "D": "Fibonaççi ardıcıllığı", "E": "Sadə ardıcıllıq"}', 'B', NULL);
INSERT INTO public.questions VALUES (464, 17, '2, 4, 6, 8, ... ədədi proqresiyasının fərqi (d) neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "0"}', 'B', NULL);
INSERT INTO public.questions VALUES (465, 17, '3, 6, 9, 12, ... ədədi proqresiyasının fərqi (d) neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "6"}', 'C', NULL);
INSERT INTO public.questions VALUES (466, 17, '1, 2, 4, 8, ... ardıcıllığı hansı proqresiyadır?', '{"A": "Ədədi proqresiya", "B": "Həndəsi proqresiya", "C": "Nə AP, nə də GP", "D": "Fibonaççi ardıcıllığı", "E": "Sadə ardıcıllıq"}', 'B', NULL);
INSERT INTO public.questions VALUES (467, 17, '1, 2, 4, 8, ... həndəsi proqresiyasının vuruğu (q) neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "8"}', 'B', NULL);
INSERT INTO public.questions VALUES (468, 17, '3, 9, 27, 81, ... həndəsi proqresiyasının vuruğu (q) neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "9", "E": "27"}', 'C', NULL);
INSERT INTO public.questions VALUES (469, 17, '5, 10, 15, 20, ... ədədi proqresiyasının fərqi (d) neçədir?', '{"A": "2", "B": "3", "C": "4", "D": "5", "E": "10"}', 'D', NULL);
INSERT INTO public.questions VALUES (470, 17, '10, 8, 6, 4, ... ədədi proqresiyasının fərqi (d) neçədir?', '{"A": "2", "B": "-2", "C": "4", "D": "-4", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (471, 17, '1, 3, 5, 7, ... ədədi proqresiyasının 5-ci həddi neçədir?', '{"A": "7", "B": "8", "C": "9", "D": "10", "E": "11"}', 'C', NULL);
INSERT INTO public.questions VALUES (472, 17, '2, 4, 6, 8, ... ədədi proqresiyasının 6-cı həddi neçədir?', '{"A": "10", "B": "11", "C": "12", "D": "13", "E": "14"}', 'C', NULL);
INSERT INTO public.questions VALUES (473, 17, '3, 6, 9, 12, ... ədədi proqresiyasının 5-ci həddi neçədir?', '{"A": "12", "B": "13", "C": "14", "D": "15", "E": "16"}', 'D', NULL);
INSERT INTO public.questions VALUES (474, 17, '1, 2, 4, 8, ... həndəsi proqresiyasının 5-ci həddi neçədir?', '{"A": "8", "B": "12", "C": "16", "D": "32", "E": "64"}', 'C', NULL);
INSERT INTO public.questions VALUES (475, 17, '2, 6, 18, 54, ... həndəsi proqresiyasının 5-ci həddi neçədir?', '{"A": "108", "B": "162", "C": "216", "D": "324", "E": "486"}', 'B', NULL);
INSERT INTO public.questions VALUES (476, 17, '10, 20, 30, 40, ... ədədi proqresiyasının növbəti həddi neçədir?', '{"A": "45", "B": "50", "C": "55", "D": "60", "E": "70"}', 'B', NULL);
INSERT INTO public.questions VALUES (477, 17, '100, 90, 80, 70, ... ədədi proqresiyasının növbəti həddi neçədir?', '{"A": "50", "B": "55", "C": "60", "D": "65", "E": "75"}', 'C', NULL);
INSERT INTO public.questions VALUES (478, 17, '1, 4, 9, 16, ... ardıcıllığı hansı proqresiyadır?', '{"A": "Ədədi proqresiya", "B": "Həndəsi proqresiya", "C": "Nə AP, nə də GP (kvadrat ədədlər)", "D": "Fibonaççi ardıcıllığı", "E": "Sadə ardıcıllıq"}', 'C', NULL);
INSERT INTO public.questions VALUES (479, 17, 'Ədədi proqresiyanın n-ci həddinin düsturu hansıdır?', '{"A": "a_n = a_1 + (n-1)d", "B": "a_n = a_1 · q^(n-1)", "C": "a_n = a_1 + nd", "D": "a_n = a_1 · q^n", "E": "a_n = a_1 - (n-1)d"}', 'A', NULL);
INSERT INTO public.questions VALUES (480, 17, 'Həndəsi proqresiyanın n-ci həddinin düsturu hansıdır?', '{"A": "a_n = a_1 + (n-1)d", "B": "a_n = a_1 · q^(n-1)", "C": "a_n = a_1 + nd", "D": "a_n = a_1 · q^n", "E": "a_n = a_1 - (n-1)d"}', 'B', NULL);
INSERT INTO public.questions VALUES (481, 17, '2, 5, 8, 11, ... ədədi proqresiyasının 10-cu həddi neçədir?', '{"A": "26", "B": "27", "C": "28", "D": "29", "E": "30"}', 'D', NULL);
INSERT INTO public.questions VALUES (482, 17, '1, 3, 5, 7, ... ədədi proqresiyasının 10-cu həddi neçədir?', '{"A": "17", "B": "18", "C": "19", "D": "20", "E": "21"}', 'C', NULL);
INSERT INTO public.questions VALUES (483, 17, '1, 2, 4, 8, ... həndəsi proqresiyasının 6-cı həddi neçədir?', '{"A": "16", "B": "24", "C": "32", "D": "48", "E": "64"}', 'C', NULL);
INSERT INTO public.questions VALUES (484, 17, '5, 5, 5, 5, ... ardıcıllığı hansı proqresiyadır?', '{"A": "Yalnız ədədi proqresiya (d=0)", "B": "Yalnız həndəsi proqresiya (q=1)", "C": "Həm ədədi, həm də həndəsi proqresiya", "D": "Nə AP, nə də GP", "E": "Fibonaççi ardıcıllığı"}', 'C', NULL);
INSERT INTO public.questions VALUES (485, 17, 'Funksiya nədir?', '{"A": "Bir dəyişənin digər dəyişəndən asılılığı", "B": "Yalnız ədədlər çoxluğu", "C": "Bərabərlik", "D": "Tənlik", "E": "Bərabərsizlik"}', 'A', NULL);
INSERT INTO public.questions VALUES (486, 17, 'Funksiyada bir dəyişənin hər qiymətinə digər dəyişənin neçə qiyməti uyğun gəlir?', '{"A": "0", "B": "1", "C": "2", "D": "3", "E": "İstənilən sayda"}', 'B', NULL);
INSERT INTO public.questions VALUES (487, 17, 'y = f(x) yazılışında x nə adlanır?', '{"A": "Asılı dəyişən", "B": "Sərbəst (arqument) dəyişən", "C": "Funksiya", "D": "Qiymət", "E": "Əmsal"}', 'B', NULL);
INSERT INTO public.questions VALUES (488, 17, 'y = f(x) yazılışında y nə adlanır?', '{"A": "Asılı dəyişən (funksiyanın qiyməti)", "B": "Sərbəst dəyişən", "C": "Arqument", "D": "Əmsal", "E": "Sabit"}', 'A', NULL);
INSERT INTO public.questions VALUES (489, 17, 'Funksiyanın təyin oblastı nədir?', '{"A": "y-in aldığı bütün qiymətlər", "B": "x-in aldığı bütün mümkün qiymətlər", "C": "Funksiyanın qrafiki", "D": "Funksiyanın sıfırları", "E": "Funksiyanın maksimumu"}', 'B', NULL);
INSERT INTO public.questions VALUES (490, 17, 'Funksiyanın qiymətlər oblastı nədir?', '{"A": "x-in aldığı bütün qiymətlər", "B": "y-in aldığı bütün qiymətlər", "C": "Funksiyanın qrafiki", "D": "Funksiyanın sıfırları", "E": "Funksiyanın minimumu"}', 'B', NULL);
INSERT INTO public.questions VALUES (491, 17, 'f(x) = 2x + 1 funksiyasında f(3) neçədir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'C', NULL);
INSERT INTO public.questions VALUES (492, 17, 'f(x) = x + 5 funksiyasında f(2) neçədir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'C', NULL);
INSERT INTO public.questions VALUES (493, 17, 'f(x) = 3x funksiyasında f(4) neçədir?', '{"A": "7", "B": "10", "C": "12", "D": "14", "E": "16"}', 'C', NULL);
INSERT INTO public.questions VALUES (494, 17, 'f(x) = x - 3 funksiyasında f(7) neçədir?', '{"A": "3", "B": "4", "C": "5", "D": "6", "E": "10"}', 'B', NULL);
INSERT INTO public.questions VALUES (495, 17, 'f(x) = 5x - 2 funksiyasında f(1) neçədir?', '{"A": "2", "B": "3", "C": "4", "D": "5", "E": "7"}', 'B', NULL);
INSERT INTO public.questions VALUES (496, 17, 'f(x) = x^2 funksiyasında f(3) neçədir?', '{"A": "3", "B": "6", "C": "9", "D": "12", "E": "27"}', 'C', NULL);
INSERT INTO public.questions VALUES (497, 17, 'f(x) = x^2 + 1 funksiyasında f(2) neçədir?', '{"A": "3", "B": "4", "C": "5", "D": "6", "E": "8"}', 'C', NULL);
INSERT INTO public.questions VALUES (498, 17, 'f(x) = 2x funksiyasında f(0) neçədir?', '{"A": "0", "B": "1", "C": "2", "D": "3", "E": "4"}', 'A', NULL);
INSERT INTO public.questions VALUES (499, 17, 'f(x) = x + 1 funksiyasında f(-2) neçədir?', '{"A": "-3", "B": "-2", "C": "-1", "D": "0", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (500, 17, 'f(x) = 4x funksiyasında f(1/2) neçədir?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "8"}', 'B', NULL);
INSERT INTO public.questions VALUES (501, 17, 'f(x) = x^3 funksiyasında f(2) neçədir?', '{"A": "4", "B": "6", "C": "8", "D": "9", "E": "12"}', 'C', NULL);
INSERT INTO public.questions VALUES (502, 17, 'f(x) = 10 - x funksiyasında f(4) neçədir?', '{"A": "4", "B": "5", "C": "6", "D": "7", "E": "10"}', 'C', NULL);
INSERT INTO public.questions VALUES (503, 17, 'f(x) = 2x + 3 funksiyasında f(-1) neçədir?', '{"A": "-1", "B": "0", "C": "1", "D": "2", "E": "5"}', 'C', NULL);
INSERT INTO public.questions VALUES (504, 17, 'f(x) = x^2 - 1 funksiyasında f(3) neçədir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'D', NULL);
INSERT INTO public.questions VALUES (505, 17, 'Funksiyanın qrafiki nədir?', '{"A": "x oxu", "B": "y oxu", "C": "Koordinat müstəvisində funksiyanı təsvir edən əyri/xətt", "D": "Yalnız düz xətt", "E": "Yalnız parabol"}', 'C', NULL);
INSERT INTO public.questions VALUES (506, 17, 'y = x funksiyasının qrafiki hansıdır?', '{"A": "Üfüqi xətt", "B": "Şaquli xətt", "C": "Koordinat başlanğıcından keçən düz xətt (bissektrisa)", "D": "Parabola", "E": "Dairə"}', 'C', NULL);
INSERT INTO public.questions VALUES (507, 17, 'y = 2x funksiyası hansı funksiyadır?', '{"A": "Xətti funksiya", "B": "Kvadrat funksiya", "C": "Kub funksiya", "D": "Sabit funksiya", "E": "Tərs mütənasiblik"}', 'A', NULL);
INSERT INTO public.questions VALUES (508, 17, 'y = x^2 funksiyası hansı funksiyadır?', '{"A": "Xətti funksiya", "B": "Kvadrat funksiya", "C": "Kub funksiya", "D": "Sabit funksiya", "E": "Tərs mütənasiblik"}', 'B', NULL);
INSERT INTO public.questions VALUES (509, 17, 'y = 5 funksiyası hansı funksiyadır?', '{"A": "Xətti funksiya", "B": "Kvadrat funksiya", "C": "Sabit funksiya", "D": "Kub funksiya", "E": "Tərs mütənasiblik"}', 'C', NULL);
INSERT INTO public.questions VALUES (510, 17, 'y = x^2 funksiyasının qrafiki hansı formadadır?', '{"A": "Düz xətt", "B": "Parabola", "C": "Dairə", "D": "Hiperbola", "E": "Ellips"}', 'B', NULL);
INSERT INTO public.questions VALUES (511, 17, 'y = x^3 funksiyası hansı funksiyadır?', '{"A": "Xətti", "B": "Kvadrat", "C": "Kub", "D": "Sabit", "E": "Tərs mütənasiblik"}', 'C', NULL);
INSERT INTO public.questions VALUES (512, 17, 'f(x) = 2x + 5 funksiyasında f(0) neçədir?', '{"A": "0", "B": "2", "C": "5", "D": "7", "E": "10"}', 'C', NULL);
INSERT INTO public.questions VALUES (513, 17, 'f(x) = x - 10 funksiyasında f(10) neçədir?', '{"A": "0", "B": "10", "C": "20", "D": "-10", "E": "1"}', 'A', NULL);
INSERT INTO public.questions VALUES (514, 17, 'f(x) = 3x + 1 funksiyasında f(2) neçədir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'C', NULL);
INSERT INTO public.questions VALUES (515, 17, 'Funksiyanın sıfırı nədir?', '{"A": "f(x) = 0 olan x qiyməti", "B": "x = 0 olan f(x) qiyməti", "C": "Funksiyanın ən böyük qiyməti", "D": "Funksiyanın ən kiçik qiyməti", "E": "Funksiyanın təyin oblastı"}', 'A', NULL);
INSERT INTO public.questions VALUES (516, 17, 'f(x) = x - 4 funksiyasının sıfırı neçədir?', '{"A": "-4", "B": "0", "C": "4", "D": "8", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (517, 17, 'f(x) = 2x - 6 funksiyasının sıfırı neçədir?', '{"A": "2", "B": "3", "C": "4", "D": "6", "E": "-3"}', 'B', NULL);
INSERT INTO public.questions VALUES (518, 17, 'f(x) = x + 2 funksiyasının sıfırı neçədir?', '{"A": "2", "B": "-2", "C": "0", "D": "4", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (519, 17, 'f(x) = x^2 funksiyasının sıfırı neçədir?', '{"A": "0", "B": "1", "C": "2", "D": "-1", "E": "4"}', 'A', NULL);
INSERT INTO public.questions VALUES (520, 17, 'f(x) = 5x funksiyasının sıfırı neçədir?', '{"A": "0", "B": "1", "C": "5", "D": "-5", "E": "10"}', 'A', NULL);
INSERT INTO public.questions VALUES (521, 17, 'f(x) = x^2 - 4 funksiyasının sıfırları hansılardır?', '{"A": "x = 2", "B": "x = -2", "C": "x = 2 və x = -2", "D": "x = 4", "E": "x = 0"}', 'C', NULL);
INSERT INTO public.questions VALUES (522, 17, 'f(x) = x^2 - 9 funksiyasının sıfırları hansılardır?', '{"A": "x = 3", "B": "x = -3", "C": "x = 3 və x = -3", "D": "x = 9", "E": "x = 0"}', 'C', NULL);
INSERT INTO public.questions VALUES (523, 17, 'f(x) = 2x funksiyasında f(5) + f(1) cəmi neçədir?', '{"A": "10", "B": "11", "C": "12", "D": "13", "E": "14"}', 'C', NULL);
INSERT INTO public.questions VALUES (524, 17, 'f(x) = x + 1 funksiyasında f(2) - f(0) fərqi neçədir?', '{"A": "0", "B": "1", "C": "2", "D": "3", "E": "4"}', 'C', NULL);
INSERT INTO public.questions VALUES (525, 17, 'f(x) = 3x funksiyasında f(2) + f(3) cəmi neçədir?', '{"A": "10", "B": "12", "C": "15", "D": "18", "E": "20"}', 'C', NULL);
INSERT INTO public.questions VALUES (526, 17, 'f(x) = x^2 funksiyasında f(2) + f(3) cəmi neçədir?', '{"A": "5", "B": "9", "C": "13", "D": "16", "E": "25"}', 'C', NULL);
INSERT INTO public.questions VALUES (527, 17, 'f(x) = 4x - 1 funksiyasında f(2) neçədir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'C', NULL);
INSERT INTO public.questions VALUES (528, 17, 'f(x) = x + 7 funksiyasında f(3) neçədir?', '{"A": "7", "B": "8", "C": "9", "D": "10", "E": "11"}', 'D', NULL);
INSERT INTO public.questions VALUES (529, 19, 'Üçbucağın daxili bucaqlarının cəmi neçə dərəcədir?', '{"A": "90°", "B": "180°", "C": "270°", "D": "360°", "E": "45°"}', 'B', NULL);
INSERT INTO public.questions VALUES (530, 19, 'Neçə tərəfi olan fiqura üçbucaq deyilir?', '{"A": "2", "B": "3", "C": "4", "D": "5", "E": "6"}', 'B', NULL);
INSERT INTO public.questions VALUES (531, 19, 'Bütün tərəfləri bərabər olan üçbucağa nə deyilir?', '{"A": "Bərabəryanlı", "B": "Bərabərtərəfli", "C": "Müxtəliftərəfli", "D": "Düzbucaqlı", "E": "Kütbucaqlı"}', 'B', NULL);
INSERT INTO public.questions VALUES (532, 19, 'İki tərəfi bərabər olan üçbucağa nə deyilir?', '{"A": "Bərabəryanlı", "B": "Bərabərtərəfli", "C": "Müxtəliftərəfli", "D": "Düzbucaqlı", "E": "İtibucaqlı"}', 'A', NULL);
INSERT INTO public.questions VALUES (533, 19, 'Bütün tərəfləri müxtəlif olan üçbucağa nə deyilir?', '{"A": "Bərabəryanlı", "B": "Bərabərtərəfli", "C": "Müxtəliftərəfli", "D": "Düzbucaqlı", "E": "Kütbucaqlı"}', 'C', NULL);
INSERT INTO public.questions VALUES (534, 19, 'Bir bucağı 90° olan üçbucağa nə deyilir?', '{"A": "İtibucaqlı", "B": "Düzbucaqlı", "C": "Kütbucaqlı", "D": "Bərabərtərəfli", "E": "Müxtəliftərəfli"}', 'B', NULL);
INSERT INTO public.questions VALUES (535, 19, 'Bir bucağı 90°-dən böyük olan üçbucağa nə deyilir?', '{"A": "İtibucaqlı", "B": "Düzbucaqlı", "C": "Kütbucaqlı", "D": "Bərabərtərəfli", "E": "Müxtəliftərəfli"}', 'C', NULL);
INSERT INTO public.questions VALUES (536, 19, 'Bütün bucaqları 90°-dən kiçik olan üçbucağa nə deyilir?', '{"A": "İtibucaqlı", "B": "Düzbucaqlı", "C": "Kütbucaqlı", "D": "Bərabərtərəfli", "E": "Müxtəliftərəfli"}', 'A', NULL);
INSERT INTO public.questions VALUES (537, 19, 'Bərabərtərəfli üçbucağın hər bir bucağı neçə dərəcədir?', '{"A": "30°", "B": "45°", "C": "60°", "D": "90°", "E": "120°"}', 'C', NULL);
INSERT INTO public.questions VALUES (538, 19, 'Düzbucaqlı üçbucağın iti bucaqlarının cəmi neçə dərəcədir?', '{"A": "45°", "B": "60°", "C": "90°", "D": "180°", "E": "120°"}', 'C', NULL);
INSERT INTO public.questions VALUES (539, 19, 'Üçbucağın bir bucağı 50°, digəri 60°-dir. Üçüncü bucaq neçə dərəcədir?', '{"A": "50°", "B": "60°", "C": "70°", "D": "80°", "E": "90°"}', 'C', NULL);
INSERT INTO public.questions VALUES (540, 19, 'Üçbucağın bir bucağı 40°, digəri 80°-dir. Üçüncü bucaq neçə dərəcədir?', '{"A": "40°", "B": "50°", "C": "60°", "D": "70°", "E": "80°"}', 'C', NULL);
INSERT INTO public.questions VALUES (541, 19, 'Üçbucağın bir bucağı 30°, digəri 90°-dir. Üçüncü bucaq neçə dərəcədir?', '{"A": "30°", "B": "45°", "C": "60°", "D": "90°", "E": "120°"}', 'C', NULL);
INSERT INTO public.questions VALUES (542, 19, 'Üçbucağın bir bucağı 100°, digəri 40°-dir. Üçüncü bucaq neçə dərəcədir?', '{"A": "30°", "B": "40°", "C": "50°", "D": "60°", "E": "70°"}', 'B', NULL);
INSERT INTO public.questions VALUES (543, 19, 'Üçbucağın bir bucağı 70°, digəri 70°-dir. Üçüncü bucaq neçə dərəcədir?', '{"A": "40°", "B": "50°", "C": "60°", "D": "70°", "E": "80°"}', 'A', NULL);
INSERT INTO public.questions VALUES (544, 19, 'Üçbucağın xarici bucağı ona qonşu olmayan iki daxili bucağın cəminə bərabərdirmi?', '{"A": "Bəli", "B": "Xeyr", "C": "Bəzən", "D": "Yalnız düzbucaqlıda", "E": "Yalnız bərabərtərəflidə"}', 'A', NULL);
INSERT INTO public.questions VALUES (545, 19, 'Üçbucağın tərəfləri 3 sm, 4 sm və 5 sm-dir. Bu üçbucaq hansı növdür?', '{"A": "Bərabərtərəfli", "B": "Bərabəryanlı", "C": "Düzbucaqlı", "D": "Kütbucaqlı", "E": "Müxtəliftərəfli"}', 'C', NULL);
INSERT INTO public.questions VALUES (546, 19, 'Üçbucağın tərəfləri 5 sm, 5 sm və 5 sm-dir. Bu üçbucaq hansı növdür?', '{"A": "Bərabərtərəfli", "B": "Bərabəryanlı", "C": "Müxtəliftərəfli", "D": "Düzbucaqlı", "E": "Kütbucaqlı"}', 'A', NULL);
INSERT INTO public.questions VALUES (547, 19, 'Üçbucağın tərəfləri 6 sm, 6 sm və 8 sm-dir. Bu üçbucaq hansı növdür?', '{"A": "Bərabərtərəfli", "B": "Bərabəryanlı", "C": "Müxtəliftərəfli", "D": "Düzbucaqlı", "E": "Kütbucaqlı"}', 'B', NULL);
INSERT INTO public.questions VALUES (548, 19, 'Üçbucağın tərəfləri 4 sm, 5 sm və 6 sm-dir. Bu üçbucaq hansı növdür?', '{"A": "Bərabərtərəfli", "B": "Bərabəryanlı", "C": "Müxtəliftərəfli", "D": "Düzbucaqlı", "E": "Kütbucaqlı"}', 'C', NULL);
INSERT INTO public.questions VALUES (549, 19, 'Üçbucağın perimetri nədir?', '{"A": "Bütün tərəflərinin cəmi", "B": "Bütün bucaqlarının cəmi", "C": "Ən böyük tərəfi", "D": "Ən kiçik tərəfi", "E": "Tərəflərin hasili"}', 'A', NULL);
INSERT INTO public.questions VALUES (550, 19, 'Tərəfləri 3 sm, 4 sm və 5 sm olan üçbucağın perimetri neçə sm-dir?', '{"A": "7", "B": "9", "C": "12", "D": "15", "E": "20"}', 'C', NULL);
INSERT INTO public.questions VALUES (551, 19, 'Tərəfləri 5 sm, 5 sm və 6 sm olan üçbucağın perimetri neçə sm-dir?', '{"A": "11", "B": "14", "C": "16", "D": "18", "E": "20"}', 'C', NULL);
INSERT INTO public.questions VALUES (552, 19, 'Tərəfləri 6 sm, 8 sm və 10 sm olan üçbucağın perimetri neçə sm-dir?', '{"A": "18", "B": "20", "C": "22", "D": "24", "E": "26"}', 'D', NULL);
INSERT INTO public.questions VALUES (553, 19, 'Tərəfləri 4 sm, 4 sm və 4 sm olan üçbucağın perimetri neçə sm-dir?', '{"A": "8", "B": "10", "C": "12", "D": "14", "E": "16"}', 'C', NULL);
INSERT INTO public.questions VALUES (554, 19, 'Düzbucaqlı üçbucağın ən uzun tərəfinə nə deyilir?', '{"A": "Katet", "B": "Hipotenuz", "C": "Median", "D": "Bissektrisa", "E": "Hündürlük"}', 'B', NULL);
INSERT INTO public.questions VALUES (555, 19, 'Düzbucaqlı üçbucağın düz bucağı əmələ gətirən tərəflərinə nə deyilir?', '{"A": "Hipotenuz", "B": "Katetlər", "C": "Medianlar", "D": "Bissektrisalar", "E": "Hündürlüklər"}', 'B', NULL);
INSERT INTO public.questions VALUES (556, 19, 'Pifaqor teoreminə görə, düzbucaqlı üçbucaqda hipotenuzun kvadratı nəyə bərabərdir?', '{"A": "Katetlərin cəminə", "B": "Katetlərin kvadratlarının cəminə", "C": "Katetlərin hasilinə", "D": "Katetlərin fərqinə", "E": "Hipotenuzun kvadratına"}', 'B', NULL);
INSERT INTO public.questions VALUES (557, 19, 'Katetləri 3 sm və 4 sm olan düzbucaqlı üçbucağın hipotenuzu neçə sm-dir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'A', NULL);
INSERT INTO public.questions VALUES (558, 19, 'Katetləri 6 sm və 8 sm olan düzbucaqlı üçbucağın hipotenuzu neçə sm-dir?', '{"A": "10", "B": "12", "C": "14", "D": "16", "E": "18"}', 'A', NULL);
INSERT INTO public.questions VALUES (559, 19, 'Katetləri 5 sm və 12 sm olan düzbucaqlı üçbucağın hipotenuzu neçə sm-dir?', '{"A": "10", "B": "12", "C": "13", "D": "14", "E": "15"}', 'C', NULL);
INSERT INTO public.questions VALUES (560, 19, 'Katetləri 8 sm və 15 sm olan düzbucaqlı üçbucağın hipotenuzu neçə sm-dir?', '{"A": "16", "B": "17", "C": "18", "D": "19", "E": "20"}', 'B', NULL);
INSERT INTO public.questions VALUES (561, 19, 'Hipotenuzu 10 sm, bir kateti 6 sm olan düzbucaqlı üçbucağın digər kateti neçə sm-dir?', '{"A": "4", "B": "6", "C": "8", "D": "10", "E": "12"}', 'C', NULL);
INSERT INTO public.questions VALUES (562, 19, 'Hipotenuzu 13 sm, bir kateti 5 sm olan düzbucaqlı üçbucağın digər kateti neçə sm-dir?', '{"A": "8", "B": "10", "C": "12", "D": "14", "E": "15"}', 'C', NULL);
INSERT INTO public.questions VALUES (563, 19, 'Üçbucağın sahəsi hansı düsturla hesablanır?', '{"A": "S = a · b", "B": "S = 1/2 · a · h", "C": "S = a + b + c", "D": "S = 2 · a", "E": "S = a^2"}', 'B', NULL);
INSERT INTO public.questions VALUES (564, 19, 'Oturağı 6 sm, hündürlüyü 4 sm olan üçbucağın sahəsi neçə sm²-dir?', '{"A": "10", "B": "12", "C": "14", "D": "24", "E": "48"}', 'B', NULL);
INSERT INTO public.questions VALUES (565, 19, 'Oturağı 10 sm, hündürlüyü 5 sm olan üçbucağın sahəsi neçə sm²-dir?', '{"A": "15", "B": "20", "C": "25", "D": "50", "E": "100"}', 'C', NULL);
INSERT INTO public.questions VALUES (566, 19, 'Oturağı 8 sm, hündürlüyü 6 sm olan üçbucağın sahəsi neçə sm²-dir?', '{"A": "14", "B": "24", "C": "28", "D": "48", "E": "56"}', 'B', NULL);
INSERT INTO public.questions VALUES (567, 19, 'Tərəfləri 3 sm, 4 sm, 5 sm olan düzbucaqlı üçbucağın sahəsi neçə sm²-dir?', '{"A": "6", "B": "8", "C": "10", "D": "12", "E": "20"}', 'A', NULL);
INSERT INTO public.questions VALUES (568, 19, 'Tərəfləri 6 sm, 8 sm, 10 sm olan düzbucaqlı üçbucağın sahəsi neçə sm²-dir?', '{"A": "12", "B": "24", "C": "30", "D": "40", "E": "48"}', 'B', NULL);
INSERT INTO public.questions VALUES (569, 19, 'Üçbucağın təpəsini qarşı tərəfin ortası ilə birləşdirən parçaya nə deyilir?', '{"A": "Hündürlük", "B": "Median", "C": "Bissektrisa", "D": "Orta xətt", "E": "Katet"}', 'B', NULL);
INSERT INTO public.questions VALUES (570, 19, 'Üçbucağın bucağını yarıya bölən şüaya nə deyilir?', '{"A": "Hündürlük", "B": "Median", "C": "Bissektrisa", "D": "Orta xətt", "E": "Katet"}', 'C', NULL);
INSERT INTO public.questions VALUES (571, 19, 'Üçbucağın təpəsindən qarşı tərəfə (və ya onun uzantısına) çəkilən perpendikulyara nə deyilir?', '{"A": "Hündürlük", "B": "Median", "C": "Bissektrisa", "D": "Orta xətt", "E": "Katet"}', 'A', NULL);
INSERT INTO public.questions VALUES (572, 19, 'Üçbucağın iki tərəfinin orta nöqtələrini birləşdirən parçaya nə deyilir?', '{"A": "Hündürlük", "B": "Median", "C": "Bissektrisa", "D": "Orta xətt", "E": "Katet"}', 'D', NULL);
INSERT INTO public.questions VALUES (796, NULL, '"Böyük" sözünün antonimi hansıdır?', '{"A": "Nəhəng", "B": "Kiçik", "C": "Geniş", "D": "Uca", "E": "Əzəmətli"}', 'B', NULL);
INSERT INTO public.questions VALUES (573, 19, 'Bərabəryanlı üçbucaqda oturağa çəkilən median eyni zamanda nədir?', '{"A": "Yalnız median", "B": "Hündürlük və bissektrisa", "C": "Yalnız bissektrisa", "D": "Yalnız hündürlük", "E": "Katet"}', 'B', NULL);
INSERT INTO public.questions VALUES (574, 19, 'Üçbucağın tərəfləri 2 sm, 3 sm və 6 sm ola bilərmi?', '{"A": "Bəli", "B": "Xeyr (üçbucaq bərabərsizliyi ödənmir)", "C": "Bəzən", "D": "Yalnız düzbucaqlıda", "E": "Yalnız bərabərtərəflidə"}', 'B', NULL);
INSERT INTO public.questions VALUES (575, 19, 'Üçbucağın tərəfləri 4 sm, 5 sm və 9 sm ola bilərmi?', '{"A": "Bəli", "B": "Xeyr (üçbucaq bərabərsizliyi ödənmir)", "C": "Bəzən", "D": "Yalnız düzbucaqlıda", "E": "Yalnız bərabəryanlıda"}', 'B', NULL);
INSERT INTO public.questions VALUES (576, 19, 'Üçbucağın tərəfləri 5 sm, 6 sm və 10 sm ola bilərmi?', '{"A": "Bəli", "B": "Xeyr", "C": "Bəzən", "D": "Yalnız düzbucaqlıda", "E": "Yalnız bərabərtərəflidə"}', 'A', NULL);
INSERT INTO public.questions VALUES (577, 19, 'Bərabərtərəfli üçbucağın tərəfi 6 sm-dirsə, perimetri neçə sm-dir?', '{"A": "12", "B": "15", "C": "18", "D": "20", "E": "24"}', 'C', NULL);
INSERT INTO public.questions VALUES (578, 19, 'Bərabəryanlı üçbucağın yan tərəfi 7 sm, oturağı 4 sm-dirsə, perimetri neçə sm-dir?', '{"A": "11", "B": "14", "C": "15", "D": "18", "E": "21"}', 'D', NULL);
INSERT INTO public.questions VALUES (579, 21, 'Düzgün beşbucağın bir daxili bucağı neçə dərəcədir?', '{"A": "90°", "B": "100°", "C": "108°", "D": "120°", "E": "135°"}', 'C', NULL);
INSERT INTO public.questions VALUES (580, 21, 'Düzgün altıbucağın bir daxili bucağı neçə dərəcədir?', '{"A": "108°", "B": "120°", "C": "135°", "D": "144°", "E": "150°"}', 'B', NULL);
INSERT INTO public.questions VALUES (581, 21, 'Düzgün səkkizbucağın bir daxili bucağı neçə dərəcədir?', '{"A": "120°", "B": "135°", "C": "140°", "D": "144°", "E": "150°"}', 'B', NULL);
INSERT INTO public.questions VALUES (582, 21, 'Daxili bucaqlarının cəmi 720° olan çoxbucaqlı neçə tərəflidir?', '{"A": "4", "B": "5", "C": "6", "D": "7", "E": "8"}', 'C', NULL);
INSERT INTO public.questions VALUES (583, 21, 'Daxili bucaqlarının cəmi 1080° olan çoxbucaqlı neçə tərəflidir?', '{"A": "6", "B": "7", "C": "8", "D": "9", "E": "10"}', 'C', NULL);
INSERT INTO public.questions VALUES (584, 21, 'Daxili bucaqlarının cəmi 1440° olan çoxbucaqlı neçə tərəflidir?', '{"A": "8", "B": "9", "C": "10", "D": "11", "E": "12"}', 'C', NULL);
INSERT INTO public.questions VALUES (585, 21, 'Düzgün onbucağın bir daxili bucağı neçə dərəcədir?', '{"A": "144°", "B": "150°", "C": "156°", "D": "160°", "E": "162°"}', 'A', NULL);
INSERT INTO public.questions VALUES (586, 21, 'Düzgün onikibucağın bir daxili bucağı neçə dərəcədir?', '{"A": "144°", "B": "150°", "C": "156°", "D": "160°", "E": "165°"}', 'B', NULL);
INSERT INTO public.questions VALUES (587, 21, 'Düzgün beşbucağın bir xarici bucağı neçə dərəcədir?', '{"A": "60°", "B": "72°", "C": "80°", "D": "90°", "E": "108°"}', 'B', NULL);
INSERT INTO public.questions VALUES (588, 21, 'Düzgün altıbucağın bir xarici bucağı neçə dərəcədir?', '{"A": "45°", "B": "50°", "C": "60°", "D": "72°", "E": "90°"}', 'C', NULL);
INSERT INTO public.questions VALUES (589, 21, 'Düzgün səkkizbucağın bir xarici bucağı neçə dərəcədir?', '{"A": "30°", "B": "40°", "C": "45°", "D": "50°", "E": "60°"}', 'C', NULL);
INSERT INTO public.questions VALUES (590, 21, 'Bir xarici bucağı 36° olan düzgün çoxbucaqlı neçə tərəflidir?', '{"A": "8", "B": "9", "C": "10", "D": "11", "E": "12"}', 'C', NULL);
INSERT INTO public.questions VALUES (591, 21, 'Bir xarici bucağı 24° olan düzgün çoxbucaqlı neçə tərəflidir?', '{"A": "12", "B": "14", "C": "15", "D": "16", "E": "18"}', 'C', NULL);
INSERT INTO public.questions VALUES (592, 21, 'Bir daxili bucağı 150° olan düzgün çoxbucaqlı neçə tərəflidir?', '{"A": "8", "B": "10", "C": "12", "D": "14", "E": "15"}', 'C', NULL);
INSERT INTO public.questions VALUES (593, 21, 'Bir daxili bucağı 144° olan düzgün çoxbucaqlı neçə tərəflidir?', '{"A": "8", "B": "9", "C": "10", "D": "11", "E": "12"}', 'C', NULL);
INSERT INTO public.questions VALUES (594, 21, 'Bir daxili bucağı 135° olan düzgün çoxbucaqlı neçə tərəflidir?', '{"A": "6", "B": "7", "C": "8", "D": "9", "E": "10"}', 'C', NULL);
INSERT INTO public.questions VALUES (595, 21, 'Tərəflərinin sayı 7 olan çoxbucaqlının diaqonallarının sayı neçədir?', '{"A": "10", "B": "12", "C": "14", "D": "15", "E": "21"}', 'C', NULL);
INSERT INTO public.questions VALUES (596, 21, 'Tərəflərinin sayı 8 olan çoxbucaqlının diaqonallarının sayı neçədir?', '{"A": "16", "B": "18", "C": "20", "D": "24", "E": "28"}', 'C', NULL);
INSERT INTO public.questions VALUES (597, 21, 'Diaqonallarının sayı 9 olan çoxbucaqlı neçə tərəflidir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'B', NULL);
INSERT INTO public.questions VALUES (598, 21, 'Diaqonallarının sayı 20 olan çoxbucaqlı neçə tərəflidir?', '{"A": "6", "B": "7", "C": "8", "D": "9", "E": "10"}', 'C', NULL);
INSERT INTO public.questions VALUES (599, 21, 'Düzgün altıbucağın tərəfi 5 sm-dirsə, perimetri neçə sm-dir?', '{"A": "20", "B": "25", "C": "30", "D": "35", "E": "40"}', 'C', NULL);
INSERT INTO public.questions VALUES (600, 21, 'Düzgün səkkizbucağın tərəfi 4 sm-dirsə, perimetri neçə sm-dir?', '{"A": "24", "B": "28", "C": "32", "D": "36", "E": "40"}', 'C', NULL);
INSERT INTO public.questions VALUES (601, 21, 'Perimetri 42 sm olan düzgün yeddibucağın bir tərəfi neçə sm-dir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'B', NULL);
INSERT INTO public.questions VALUES (602, 21, 'Perimetri 60 sm olan düzgün onbucağın bir tərəfi neçə sm-dir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "10"}', 'B', NULL);
INSERT INTO public.questions VALUES (603, 21, 'Düzgün beşbucağın tərəfi 6 sm-dirsə, perimetri neçə sm-dir?', '{"A": "24", "B": "28", "C": "30", "D": "32", "E": "36"}', 'C', NULL);
INSERT INTO public.questions VALUES (604, 21, 'Düzgün altıbucağın tərəfi 8 sm-dirsə, onun sahəsi neçə sm²-dir?', '{"A": "48√3", "B": "64√3", "C": "96√3", "D": "128√3", "E": "192√3"}', 'C', NULL);
INSERT INTO public.questions VALUES (605, 21, 'Düzgün altıbucağın tərəfi 4 sm-dirsə, onun sahəsi neçə sm²-dir?', '{"A": "12√3", "B": "16√3", "C": "24√3", "D": "32√3", "E": "48√3"}', 'C', NULL);
INSERT INTO public.questions VALUES (606, 21, 'Düzgün beşbucağın bir daxili və bir xarici bucağının cəmi neçə dərəcədir?', '{"A": "90°", "B": "108°", "C": "180°", "D": "270°", "E": "360°"}', 'C', NULL);
INSERT INTO public.questions VALUES (607, 21, 'Tərəflərinin sayı 9 olan çoxbucaqlının daxili bucaqlarının cəmi neçə dərəcədir?', '{"A": "1080°", "B": "1260°", "C": "1440°", "D": "1620°", "E": "1800°"}', 'B', NULL);
INSERT INTO public.questions VALUES (608, 21, 'Tərəflərinin sayı 12 olan çoxbucaqlının daxili bucaqlarının cəmi neçə dərəcədir?', '{"A": "1440°", "B": "1620°", "C": "1800°", "D": "1980°", "E": "2160°"}', 'C', NULL);
INSERT INTO public.questions VALUES (609, 23, 'Çevrə nədir?', '{"A": "Müstəvinin dairə ilə əhatə olunmuş hissəsi", "B": "Mərkəzdən eyni məsafədə yerləşən nöqtələr çoxluğu (qapalı əyri xətt)", "C": "Düz xətt parçası", "D": "Bucağın daxili hissəsi", "E": "Üçbucağın tərəfi"}', 'B', NULL);
INSERT INTO public.questions VALUES (610, 23, 'Dairə nədir?', '{"A": "Yalnız çevrə xətti", "B": "Çevrə ilə əhatə olunmuş müstəvi hissəsi", "C": "Düz xətt", "D": "Bucaq", "E": "Kəsişən iki xətt"}', 'B', NULL);
INSERT INTO public.questions VALUES (611, 23, 'Çevrənin mərkəzini çevrə üzərindəki istənilən nöqtə ilə birləşdirən parçaya nə deyilir?', '{"A": "Diametr", "B": "Radius", "C": "Vətər", "D": "Qövs", "E": "Seqment"}', 'B', NULL);
INSERT INTO public.questions VALUES (612, 23, 'Çevrənin mərkəzindən keçən və çevrəni iki nöqtədə kəsən ən uzun vətərə nə deyilir?', '{"A": "Radius", "B": "Diametr", "C": "Qövs", "D": "Seqment", "E": "Sektor"}', 'B', NULL);
INSERT INTO public.questions VALUES (613, 23, 'Diametr radiusdan neçə dəfə böyükdür?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'B', NULL);
INSERT INTO public.questions VALUES (614, 23, 'Çevrə üzərindəki iki nöqtəni birləşdirən parçaya nə deyilir?', '{"A": "Radius", "B": "Diametr", "C": "Vətər", "D": "Qövs", "E": "Sektor"}', 'C', NULL);
INSERT INTO public.questions VALUES (615, 23, 'Çevrənin uzunluğu hansı düsturla hesablanır? (r – radius, d – diametr)', '{"A": "C = πr^2", "B": "C = 2πr", "C": "C = πd^2", "D": "C = πr", "E": "C = 2πr^2"}', 'B', NULL);
INSERT INTO public.questions VALUES (616, 23, 'Dairənin sahəsi hansı düsturla hesablanır?', '{"A": "S = 2πr", "B": "S = πr^2", "C": "S = πd", "D": "S = 2πr^2", "E": "S = π^2r"}', 'B', NULL);
INSERT INTO public.questions VALUES (617, 23, 'Radiusu 5 sm olan çevrənin uzunluğu neçə sm-dir? (π ≈ 3.14)', '{"A": "10", "B": "15.7", "C": "31.4", "D": "78.5", "E": "25"}', 'C', NULL);
INSERT INTO public.questions VALUES (618, 23, 'Radiusu 3 sm olan çevrənin uzunluğu neçə sm-dir? (π ≈ 3.14)', '{"A": "6", "B": "9.42", "C": "18.84", "D": "28.26", "E": "12"}', 'C', NULL);
INSERT INTO public.questions VALUES (619, 23, 'Radiusu 4 sm olan dairənin sahəsi neçə sm²-dir? (π ≈ 3.14)', '{"A": "12.56", "B": "25.12", "C": "50.24", "D": "100.48", "E": "16"}', 'C', NULL);
INSERT INTO public.questions VALUES (620, 23, 'Radiusu 6 sm olan dairənin sahəsi neçə sm²-dir? (π ≈ 3.14)', '{"A": "18.84", "B": "37.68", "C": "113.04", "D": "226.08", "E": "36"}', 'C', NULL);
INSERT INTO public.questions VALUES (621, 23, 'Diametri 10 sm olan çevrənin uzunluğu neçə sm-dir? (π ≈ 3.14)', '{"A": "15.7", "B": "31.4", "C": "62.8", "D": "78.5", "E": "100"}', 'B', NULL);
INSERT INTO public.questions VALUES (622, 23, 'Diametri 8 sm olan dairənin sahəsi neçə sm²-dir? (π ≈ 3.14)', '{"A": "25.12", "B": "50.24", "C": "100.48", "D": "200.96", "E": "64"}', 'B', NULL);
INSERT INTO public.questions VALUES (623, 23, 'Radiusu 2 sm olan çevrənin uzunluğu neçə sm-dir? (π ≈ 3.14)', '{"A": "6.28", "B": "12.56", "C": "18.84", "D": "25.12", "E": "4"}', 'B', NULL);
INSERT INTO public.questions VALUES (624, 23, 'Radiusu 1 sm olan dairənin sahəsi neçə sm²-dir? (π ≈ 3.14)', '{"A": "3.14", "B": "6.28", "C": "12.56", "D": "1", "E": "2"}', 'A', NULL);
INSERT INTO public.questions VALUES (625, 23, 'Çevrənin radiusu 7 sm-dirsə, diametri neçə sm-dir?', '{"A": "3.5", "B": "7", "C": "14", "D": "21", "E": "49"}', 'C', NULL);
INSERT INTO public.questions VALUES (626, 23, 'Çevrənin diametri 16 sm-dirsə, radiusu neçə sm-dir?', '{"A": "4", "B": "8", "C": "16", "D": "32", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (627, 23, 'Çevrənin uzunluğu C = 20π olarsa, radiusu neçədir?', '{"A": "5", "B": "10", "C": "20", "D": "40", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (628, 23, 'Dairənin sahəsi S = 25π olarsa, radiusu neçədir?', '{"A": "5", "B": "10", "C": "25", "D": "50", "E": "2"}', 'A', NULL);
INSERT INTO public.questions VALUES (629, 23, 'Çevrənin uzunluğu C = 10π olarsa, diametri neçədir?', '{"A": "5", "B": "10", "C": "20", "D": "100", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (630, 23, 'Dairənin sahəsi S = 16π olarsa, diametri neçədir?', '{"A": "4", "B": "8", "C": "16", "D": "32", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (631, 23, 'Çevrənin 360°-lik qövsünə nə deyilir?', '{"A": "Radius", "B": "Tam çevrə", "C": "Diametr", "D": "Vətər", "E": "Sektor"}', 'B', NULL);
INSERT INTO public.questions VALUES (632, 23, 'Çevrənin iki radiusu arasındakı bucağın əhatə etdiyi hissəyə nə deyilir?', '{"A": "Seqment", "B": "Sektor", "C": "Vətər", "D": "Qövs", "E": "Diametr"}', 'B', NULL);
INSERT INTO public.questions VALUES (633, 23, 'Çevrənin vətəri ilə qövsü arasında qalan hissəyə nə deyilir?', '{"A": "Sektor", "B": "Seqment", "C": "Radius", "D": "Diametr", "E": "Mərkəz"}', 'B', NULL);
INSERT INTO public.questions VALUES (634, 23, 'Radiusu 10 sm olan çevrənin uzunluğu neçə sm-dir? (π ≈ 3.14)', '{"A": "31.4", "B": "62.8", "C": "100", "D": "314", "E": "20"}', 'B', NULL);
INSERT INTO public.questions VALUES (635, 23, 'Diametri 20 sm olan dairənin sahəsi neçə sm²-dir? (π ≈ 3.14)', '{"A": "314", "B": "628", "C": "100", "D": "1256", "E": "200"}', 'A', NULL);
INSERT INTO public.questions VALUES (636, 23, 'Radiusu 5 sm olan dairənin sahəsi neçə sm²-dir? (π ≈ 3.14)', '{"A": "15.7", "B": "31.4", "C": "78.5", "D": "157", "E": "25"}', 'C', NULL);
INSERT INTO public.questions VALUES (637, 25, 'Düzbucaqlı üçbucaqda bucağın qarşı tərəfinin hipotenuzaya nisbətinə nə deyilir?', '{"A": "Kosinus", "B": "Sinus", "C": "Tangens", "D": "Kotangens", "E": "Sekans"}', 'B', NULL);
INSERT INTO public.questions VALUES (638, 25, 'Düzbucaqlı üçbucaqda bucağa qonşu olan tərəfin hipotenuzaya nisbətinə nə deyilir?', '{"A": "Sinus", "B": "Kosinus", "C": "Tangens", "D": "Kotangens", "E": "Kosekans"}', 'B', NULL);
INSERT INTO public.questions VALUES (639, 25, 'Düzbucaqlı üçbucaqda qarşı tərəfin qonşu tərəfə nisbətinə nə deyilir?', '{"A": "Sinus", "B": "Kosinus", "C": "Tangens", "D": "Kotangens", "E": "Sekans"}', 'C', NULL);
INSERT INTO public.questions VALUES (640, 25, 'sin30° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "√3/2", "E": "√3/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (641, 25, 'cos60° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "√3/2", "E": "√3/3"}', 'B', NULL);
INSERT INTO public.questions VALUES (642, 25, 'sin90° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "-1", "E": "Müəyyən deyil"}', 'C', NULL);
INSERT INTO public.questions VALUES (643, 25, 'cos0° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "-1", "E": "Müəyyən deyil"}', 'C', NULL);
INSERT INTO public.questions VALUES (644, 25, 'sin0° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "-1", "E": "Müəyyən deyil"}', 'A', NULL);
INSERT INTO public.questions VALUES (645, 25, 'cos90° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "-1", "E": "Müəyyən deyil"}', 'A', NULL);
INSERT INTO public.questions VALUES (646, 25, 'tan45° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "√3/3", "E": "Müəyyən deyil"}', 'C', NULL);
INSERT INTO public.questions VALUES (647, 25, 'sin30° + cos60° cəmi neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "1.5", "E": "2"}', 'C', NULL);
INSERT INTO public.questions VALUES (648, 25, 'sin90° - cos0° fərqi neçədir?', '{"A": "-1", "B": "0", "C": "1", "D": "2", "E": "-2"}', 'B', NULL);
INSERT INTO public.questions VALUES (649, 25, 'tan0° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "Müəyyən deyil", "E": "√3/3"}', 'A', NULL);
INSERT INTO public.questions VALUES (650, 25, 'sin45° qiyməti neçədir?', '{"A": "0.5", "B": "1", "C": "√2/2", "D": "√3/2", "E": "√2"}', 'C', NULL);
INSERT INTO public.questions VALUES (651, 25, 'cos45° qiyməti neçədir?', '{"A": "0.5", "B": "1", "C": "√2/2", "D": "√3/2", "E": "√2"}', 'C', NULL);
INSERT INTO public.questions VALUES (652, 25, 'sin²α + cos²α cəmi neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "2", "E": "α-dan asılıdır"}', 'C', NULL);
INSERT INTO public.questions VALUES (653, 25, 'tanα hansı nisbətə bərabərdir?', '{"A": "sinα / cosα", "B": "cosα / sinα", "C": "sinα · cosα", "D": "sinα + cosα", "E": "1 / sinα"}', 'A', NULL);
INSERT INTO public.questions VALUES (654, 25, 'cotα hansı nisbətə bərabərdir?', '{"A": "sinα / cosα", "B": "cosα / sinα", "C": "sinα · cosα", "D": "sinα + cosα", "E": "1 / cosα"}', 'B', NULL);
INSERT INTO public.questions VALUES (655, 25, 'sin(90° - α) nəyə bərabərdir?', '{"A": "sinα", "B": "cosα", "C": "tanα", "D": "-sinα", "E": "-cosα"}', 'B', NULL);
INSERT INTO public.questions VALUES (656, 25, 'cos(90° - α) nəyə bərabərdir?', '{"A": "sinα", "B": "cosα", "C": "tanα", "D": "-sinα", "E": "-cosα"}', 'A', NULL);
INSERT INTO public.questions VALUES (657, 25, 'sin180° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "-1", "E": "Müəyyən deyil"}', 'A', NULL);
INSERT INTO public.questions VALUES (658, 25, 'cos180° qiyməti neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "-1", "E": "Müəyyən deyil"}', 'D', NULL);
INSERT INTO public.questions VALUES (659, 25, 'sin60° qiyməti neçədir?', '{"A": "0.5", "B": "1", "C": "√2/2", "D": "√3/2", "E": "√3/3"}', 'D', NULL);
INSERT INTO public.questions VALUES (660, 25, 'cos30° qiyməti neçədir?', '{"A": "0.5", "B": "1", "C": "√2/2", "D": "√3/2", "E": "√3/3"}', 'D', NULL);
INSERT INTO public.questions VALUES (661, 25, 'sin30° · cos60° hasilinin qiyməti neçədir?', '{"A": "0", "B": "0.25", "C": "0.5", "D": "1", "E": "2"}', 'B', NULL);
INSERT INTO public.questions VALUES (662, 25, 'tan90° qiyməti necədir?', '{"A": "0", "B": "1", "C": "Müəyyən deyil", "D": "-1", "E": "√3/3"}', 'C', NULL);
INSERT INTO public.questions VALUES (663, 25, 'Düzbucaqlı üçbucaqda bir iti bucaq 30°-dirsə, digər iti bucaq neçə dərəcədir?', '{"A": "30°", "B": "45°", "C": "60°", "D": "90°", "E": "120°"}', 'C', NULL);
INSERT INTO public.questions VALUES (664, 25, 'sinα = 0.5 olarsa, α iti bucaq neçə dərəcə ola bilər?', '{"A": "0°", "B": "30°", "C": "45°", "D": "60°", "E": "90°"}', 'B', NULL);
INSERT INTO public.questions VALUES (665, 25, 'cosα = 0.5 olarsa, α iti bucaq neçə dərəcə ola bilər?', '{"A": "0°", "B": "30°", "C": "45°", "D": "60°", "E": "90°"}', 'D', NULL);
INSERT INTO public.questions VALUES (666, 25, 'sinα = 1 olarsa, α neçə dərəcədir?', '{"A": "0°", "B": "30°", "C": "45°", "D": "60°", "E": "90°"}', 'E', NULL);
INSERT INTO public.questions VALUES (667, 25, 'cosα = 1 olarsa, α neçə dərəcədir?', '{"A": "0°", "B": "30°", "C": "45°", "D": "60°", "E": "90°"}', 'A', NULL);
INSERT INTO public.questions VALUES (668, 25, 'sin30° + sin30° cəmi neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "1.5", "E": "2"}', 'C', NULL);
INSERT INTO public.questions VALUES (669, 25, 'tanα · cotα hasilinin qiyməti neçədir? (α iti bucaq)', '{"A": "0", "B": "0.5", "C": "1", "D": "2", "E": "Müəyyən deyil"}', 'C', NULL);
INSERT INTO public.questions VALUES (670, 25, 'sin90° + cos90° cəmi neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "1.5", "E": "2"}', 'C', NULL);
INSERT INTO public.questions VALUES (671, 27, 'Ədədlər çoxluğunun orta qiyməti (ədəbi orta) necə tapılır?', '{"A": "Bütün ədədlərin cəmini onların sayına bölməklə", "B": "Ən böyük və ən kiçik ədədi toplamaqla", "C": "Ən çox təkrarlanan ədədi seçməklə", "D": "Bütün ədədləri vurmaqla", "E": "Ədədləri sıralamaqla"}', 'A', NULL);
INSERT INTO public.questions VALUES (672, 27, 'Moda nədir?', '{"A": "Ədədlərin cəmi", "B": "Ən çox təkrarlanan qiymət", "C": "Ən böyük ədəd", "D": "Ən kiçik ədəd", "E": "Ədədlərin sayı"}', 'B', NULL);
INSERT INTO public.questions VALUES (673, 27, '2, 4, 6, 8 ədədlərinin orta qiyməti neçədir?', '{"A": "4", "B": "5", "C": "6", "D": "7", "E": "8"}', 'B', NULL);
INSERT INTO public.questions VALUES (674, 27, '1, 2, 3, 4, 5 ədədlərinin orta qiyməti neçədir?', '{"A": "2", "B": "3", "C": "4", "D": "5", "E": "6"}', 'B', NULL);
INSERT INTO public.questions VALUES (675, 27, '10, 20, 30 ədədlərinin orta qiyməti neçədir?', '{"A": "10", "B": "15", "C": "20", "D": "25", "E": "30"}', 'C', NULL);
INSERT INTO public.questions VALUES (676, 27, '5, 5, 5, 5 ədədlərinin orta qiyməti neçədir?', '{"A": "0", "B": "4", "C": "5", "D": "10", "E": "20"}', 'C', NULL);
INSERT INTO public.questions VALUES (677, 27, '3, 7, 5, 9 ədədlərinin orta qiyməti neçədir?', '{"A": "5", "B": "6", "C": "7", "D": "8", "E": "9"}', 'B', NULL);
INSERT INTO public.questions VALUES (678, 27, '2, 2, 3, 3, 3, 4 çoxluğunda moda hansıdır?', '{"A": "2", "B": "3", "C": "4", "D": "2 və 3", "E": "Moda yoxdur"}', 'B', NULL);
INSERT INTO public.questions VALUES (679, 27, '1, 1, 2, 2, 3, 3 çoxluğunda moda hansıdır?', '{"A": "1", "B": "2", "C": "3", "D": "1, 2 və 3", "E": "Moda yoxdur"}', 'D', NULL);
INSERT INTO public.questions VALUES (680, 27, '4, 5, 6, 7, 8 çoxluğunda moda varmı?', '{"A": "Bəli, 4", "B": "Bəli, 8", "C": "Bəli, 6", "D": "Xeyr, moda yoxdur", "E": "Bəli, 5"}', 'D', NULL);
INSERT INTO public.questions VALUES (681, 27, '6, 6, 7, 8, 8, 8, 9 çoxluğunda moda hansıdır?', '{"A": "6", "B": "7", "C": "8", "D": "9", "E": "6 və 8"}', 'C', NULL);
INSERT INTO public.questions VALUES (682, 27, '10, 20, 20, 30, 40 çoxluğunda moda hansıdır?', '{"A": "10", "B": "20", "C": "30", "D": "40", "E": "Moda yoxdur"}', 'B', NULL);
INSERT INTO public.questions VALUES (683, 27, '2, 4, 4, 6, 8 çoxluğunun orta qiyməti neçədir?', '{"A": "4", "B": "4.8", "C": "5", "D": "5.2", "E": "6"}', 'B', NULL);
INSERT INTO public.questions VALUES (684, 27, '1, 3, 5, 7, 9 çoxluğunun orta qiyməti neçədir?', '{"A": "3", "B": "4", "C": "5", "D": "6", "E": "7"}', 'C', NULL);
INSERT INTO public.questions VALUES (685, 27, '0, 10, 20 çoxluğunun orta qiyməti neçədir?', '{"A": "5", "B": "10", "C": "15", "D": "20", "E": "30"}', 'B', NULL);
INSERT INTO public.questions VALUES (686, 27, '12, 15, 18 çoxluğunun orta qiyməti neçədir?', '{"A": "12", "B": "13", "C": "14", "D": "15", "E": "16"}', 'D', NULL);
INSERT INTO public.questions VALUES (687, 27, '7, 7, 8, 9, 9, 9, 10 çoxluğunda moda hansıdır?', '{"A": "7", "B": "8", "C": "9", "D": "10", "E": "7 və 9"}', 'C', NULL);
INSERT INTO public.questions VALUES (688, 27, '3, 3, 3, 4, 4, 5 çoxluğunda moda hansıdır?', '{"A": "3", "B": "4", "C": "5", "D": "3 və 4", "E": "Moda yoxdur"}', 'A', NULL);
INSERT INTO public.questions VALUES (689, 27, '100, 200, 300, 400 çoxluğunun orta qiyməti neçədir?', '{"A": "200", "B": "250", "C": "300", "D": "350", "E": "400"}', 'B', NULL);
INSERT INTO public.questions VALUES (690, 27, '2, 2, 3, 3, 4, 4, 4 çoxluğunda moda hansıdır?', '{"A": "2", "B": "3", "C": "4", "D": "2, 3 və 4", "E": "Moda yoxdur"}', 'C', NULL);
INSERT INTO public.questions VALUES (691, 27, '5, 10, 15, 20, 25 çoxluğunun orta qiyməti neçədir?', '{"A": "10", "B": "15", "C": "20", "D": "25", "E": "30"}', 'B', NULL);
INSERT INTO public.questions VALUES (692, 27, '8, 8, 9, 9, 9, 10, 10 çoxluğunda moda hansıdır?', '{"A": "8", "B": "9", "C": "10", "D": "8 və 10", "E": "9 və 10"}', 'B', NULL);
INSERT INTO public.questions VALUES (693, 29, 'Ehtimal nəzəriyyəsi nəyi öyrənir?', '{"A": "Həndəsi fiqurları", "B": "Təsadüfi hadisələrin baş vermə imkanlarını", "C": "Tənliklərin həllini", "D": "Ədədlərin bölünməsini", "E": "Funksiyaların qrafiklərini"}', 'B', NULL);
INSERT INTO public.questions VALUES (694, 29, 'Ehtimalın qiyməti hansı aralıqda olur?', '{"A": "-1 ilə 1 arasında", "B": "0 ilə 1 arasında (və ya 0 ≤ P ≤ 1)", "C": "1 ilə 100 arasında", "D": "Yalnız müsbət ədədlər", "E": "İstənilən ədəd"}', 'B', NULL);
INSERT INTO public.questions VALUES (695, 29, 'Müəyyən (mütləq) hadisənin ehtimalı neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "2", "E": "Müəyyən deyil"}', 'C', NULL);
INSERT INTO public.questions VALUES (696, 29, 'Qeyri-mümkün hadisənin ehtimalı neçədir?', '{"A": "0", "B": "0.5", "C": "1", "D": "2", "E": "Müəyyən deyil"}', 'A', NULL);
INSERT INTO public.questions VALUES (697, 29, 'Bir sikkə atıldıqda "gerb" düşmə ehtimalı neçədir?', '{"A": "0", "B": "1/4", "C": "1/2", "D": "1", "E": "1/3"}', 'C', NULL);
INSERT INTO public.questions VALUES (698, 29, 'Bir sikkə atıldıqda "rəqəm" düşmə ehtimalı neçədir?', '{"A": "0", "B": "1/4", "C": "1/2", "D": "1", "E": "1/3"}', 'C', NULL);
INSERT INTO public.questions VALUES (699, 29, 'Bir zər atıldıqda 3 rəqəminin düşmə ehtimalı neçədir?', '{"A": "1/2", "B": "1/3", "C": "1/6", "D": "1/4", "E": "1/5"}', 'C', NULL);
INSERT INTO public.questions VALUES (700, 29, 'Bir zər atıldıqda cüt ədəd düşmə ehtimalı neçədir?', '{"A": "1/6", "B": "1/3", "C": "1/2", "D": "2/3", "E": "5/6"}', 'C', NULL);
INSERT INTO public.questions VALUES (701, 29, 'Bir zər atıldıqda tək ədəd düşmə ehtimalı neçədir?', '{"A": "1/6", "B": "1/3", "C": "1/2", "D": "2/3", "E": "5/6"}', 'C', NULL);
INSERT INTO public.questions VALUES (702, 29, 'Bir zər atıldıqda 6-dan kiçik ədəd düşmə ehtimalı neçədir?', '{"A": "1/6", "B": "2/6", "C": "3/6", "D": "4/6", "E": "5/6"}', 'E', NULL);
INSERT INTO public.questions VALUES (703, 29, 'Bir zər atıldıqda 4-dən böyük ədəd düşmə ehtimalı neçədir?', '{"A": "1/6", "B": "2/6", "C": "3/6", "D": "4/6", "E": "5/6"}', 'B', NULL);
INSERT INTO public.questions VALUES (704, 29, 'Bir zər atıldıqda 1 və ya 2 düşmə ehtimalı neçədir?', '{"A": "1/6", "B": "2/6", "C": "3/6", "D": "4/6", "E": "5/6"}', 'B', NULL);
INSERT INTO public.questions VALUES (705, 29, 'Bir zər atıldıqda 7 düşmə ehtimalı neçədir?', '{"A": "0", "B": "1/6", "C": "1/2", "D": "1", "E": "Müəyyən deyil"}', 'A', NULL);
INSERT INTO public.questions VALUES (706, 29, 'Bir zər atıldıqda 1-dən 6-ya qədər ədəd düşmə ehtimalı neçədir?', '{"A": "0", "B": "1/6", "C": "1/2", "D": "1", "E": "Müəyyən deyil"}', 'D', NULL);
INSERT INTO public.questions VALUES (707, 29, 'Ehtimalı 0.3 olan hadisənin baş verməmə ehtimalı neçədir?', '{"A": "0.3", "B": "0.5", "C": "0.7", "D": "1", "E": "1.3"}', 'C', NULL);
INSERT INTO public.questions VALUES (708, 29, 'Ehtimalı 1/4 olan hadisənin əks hadisəsinin ehtimalı neçədir?', '{"A": "1/4", "B": "1/2", "C": "3/4", "D": "1", "E": "0"}', 'C', NULL);
INSERT INTO public.questions VALUES (709, 29, 'Ehtimalı 0.8 olan hadisənin əks hadisəsinin ehtimalı neçədir?', '{"A": "0.2", "B": "0.4", "C": "0.8", "D": "1", "E": "0"}', 'A', NULL);
INSERT INTO public.questions VALUES (710, 29, 'Bir qutuda 3 qırmızı və 2 mavi kürə var. Təsadüfi bir kürə götürüldükdə qırmızı olma ehtimalı neçədir?', '{"A": "1/5", "B": "2/5", "C": "3/5", "D": "3/2", "E": "1"}', 'C', NULL);
INSERT INTO public.questions VALUES (711, 29, 'Bir qutuda 3 qırmızı və 2 mavi kürə var. Təsadüfi bir kürə götürüldükdə mavi olma ehtimalı neçədir?', '{"A": "1/5", "B": "2/5", "C": "3/5", "D": "2/3", "E": "1"}', 'B', NULL);
INSERT INTO public.questions VALUES (712, 29, 'Bir qutuda 4 ağ və 6 qara kürə var. Təsadüfi bir kürə götürüldükdə ağ olma ehtimalı neçədir?', '{"A": "4/6", "B": "4/10", "C": "6/10", "D": "1/2", "E": "6/4"}', 'B', NULL);
INSERT INTO public.questions VALUES (713, 29, 'Bir qutuda 4 ağ və 6 qara kürə var. Təsadüfi bir kürə götürüldükdə qara olma ehtimalı neçədir?', '{"A": "4/10", "B": "5/10", "C": "6/10", "D": "1/2", "E": "4/6"}', 'C', NULL);
INSERT INTO public.questions VALUES (714, 29, '1-dən 10-a qədər ədədlər arasından təsadüfi bir ədəd seçilir. Seçilən ədədin 5 olma ehtimalı neçədir?', '{"A": "1/10", "B": "1/5", "C": "1/2", "D": "5/10", "E": "1"}', 'A', NULL);
INSERT INTO public.questions VALUES (715, 29, '1-dən 10-a qədər ədədlər arasından təsadüfi bir ədəd seçilir. Seçilən ədədin cüt olma ehtimalı neçədir?', '{"A": "1/10", "B": "3/10", "C": "5/10", "D": "7/10", "E": "9/10"}', 'C', NULL);
INSERT INTO public.questions VALUES (716, 29, '1-dən 10-a qədər ədədlər arasından təsadüfi bir ədəd seçilir. Seçilən ədədin 5-dən böyük olma ehtimalı neçədir?', '{"A": "1/10", "B": "3/10", "C": "5/10", "D": "7/10", "E": "9/10"}', 'C', NULL);
INSERT INTO public.questions VALUES (717, 29, 'İki sikkə eyni vaxtda atılır. Hər ikisinin "gerb" düşmə ehtimalı neçədir?', '{"A": "1/4", "B": "1/2", "C": "1/3", "D": "3/4", "E": "1"}', 'A', NULL);
INSERT INTO public.questions VALUES (718, 29, 'İki sikkə eyni vaxtda atılır. Ən azı bir "gerb" düşmə ehtimalı neçədir?', '{"A": "1/4", "B": "1/2", "C": "3/4", "D": "1", "E": "0"}', 'C', NULL);
INSERT INTO public.questions VALUES (719, 31, 'Fonetika nəyi öyrənir?', '{"A": "Cümlə quruluşunu", "B": "Sözlərin mənasını", "C": "Dilin səs tərkibini", "D": "Durğu işarələrini", "E": "Hərflərin yazılışını"}', 'C', NULL);
INSERT INTO public.questions VALUES (720, 31, 'Azərbaycan əlifbasında neçə hərf var?', '{"A": "26", "B": "29", "C": "32", "D": "33", "E": "36"}', 'C', NULL);
INSERT INTO public.questions VALUES (721, 31, 'Azərbaycan dilində neçə sait səs var?', '{"A": "6", "B": "7", "C": "8", "D": "9", "E": "10"}', 'D', NULL);
INSERT INTO public.questions VALUES (722, 31, 'Azərbaycan dilində neçə samit səs var?', '{"A": "21", "B": "22", "C": "23", "D": "24", "E": "25"}', 'C', NULL);
INSERT INTO public.questions VALUES (723, 31, 'Aşağıdakılardan hansı sait səsdir?', '{"A": "b", "B": "a", "C": "k", "D": "m", "E": "s"}', 'B', NULL);
INSERT INTO public.questions VALUES (724, 31, 'Aşağıdakılardan hansı samit səsdir?', '{"A": "a", "B": "e", "C": "i", "D": "b", "E": "o"}', 'D', NULL);
INSERT INTO public.questions VALUES (725, 31, 'Azərbaycan dilində sait səslər neçə qrupa bölünür?', '{"A": "2 (qalın və incə)", "B": "3", "C": "4", "D": "5", "E": "6"}', 'A', NULL);
INSERT INTO public.questions VALUES (726, 31, 'Aşağıdakılardan hansı qalın saitdir?', '{"A": "e", "B": "ə", "C": "i", "D": "a", "E": "ö"}', 'D', NULL);
INSERT INTO public.questions VALUES (727, 31, 'Aşağıdakılardan hansı incə saitdir?', '{"A": "a", "B": "o", "C": "u", "D": "e", "E": "ı"}', 'D', NULL);
INSERT INTO public.questions VALUES (728, 31, '"Kitab" sözündə neçə sait səs var?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'B', NULL);
INSERT INTO public.questions VALUES (729, 31, '"Məktəb" sözündə neçə samit səs var?', '{"A": "2", "B": "3", "C": "4", "D": "5", "E": "6"}', 'C', NULL);
INSERT INTO public.questions VALUES (730, 31, '"Gül" sözündə neçə hərf və neçə səs var?', '{"A": "3 hərf, 3 səs", "B": "3 hərf, 2 səs", "C": "3 hərf, 4 səs", "D": "2 hərf, 3 səs", "E": "4 hərf, 3 səs"}', 'A', NULL);
INSERT INTO public.questions VALUES (731, 31, '"Şəhər" sözündə neçə sait səs var?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'B', NULL);
INSERT INTO public.questions VALUES (732, 31, 'Hansı sözdə hərf sayı səs sayına bərabərdir?', '{"A": "Şəhər", "B": "Gül", "C": "Kitab", "D": "Məktəb", "E": "Yuxu"}', 'B', NULL);
INSERT INTO public.questions VALUES (733, 31, '"Yuxu" sözündə neçə səs var?', '{"A": "3", "B": "4", "C": "5", "D": "6", "E": "7"}', 'C', NULL);
INSERT INTO public.questions VALUES (734, 31, 'Azərbaycan dilində "q" hərfi hansı səsi bildirir?', '{"A": "Sait", "B": "Kar samit", "C": "Cingiltili samit", "D": "Yarımsait", "E": "Səssiz hərf"}', 'C', NULL);
INSERT INTO public.questions VALUES (735, 31, 'Aşağıdakılardan hansı cingiltili samitdir?', '{"A": "p", "B": "t", "C": "k", "D": "b", "E": "s"}', 'D', NULL);
INSERT INTO public.questions VALUES (736, 31, 'Aşağıdakılardan hansı kar samitdir?', '{"A": "b", "B": "d", "C": "g", "D": "p", "E": "z"}', 'D', NULL);
INSERT INTO public.questions VALUES (737, 31, '"Ana" sözündə neçə sait səs var?', '{"A": "0", "B": "1", "C": "2", "D": "3", "E": "4"}', 'C', NULL);
INSERT INTO public.questions VALUES (738, 31, '"Baba" sözündə neçə samit səs var?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'B', NULL);
INSERT INTO public.questions VALUES (739, 31, 'Sait səslər heca əmələ gətirirmi?', '{"A": "Bəli", "B": "Xeyr", "C": "Bəzən", "D": "Yalnız qalın saitlər", "E": "Yalnız incə saitlər"}', 'A', NULL);
INSERT INTO public.questions VALUES (740, 31, 'Samit səslər təkbaşına heca əmələ gətirirmi?', '{"A": "Bəli", "B": "Xeyr", "C": "Bəzən", "D": "Yalnız kar samitlər", "E": "Yalnız cingiltili samitlər"}', 'B', NULL);
INSERT INTO public.questions VALUES (741, 31, '"Məktəb" sözündə neçə heca var?', '{"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}', 'B', NULL);
INSERT INTO public.questions VALUES (742, 31, '"Kitabxana" sözündə neçə heca var?', '{"A": "2", "B": "3", "C": "4", "D": "5", "E": "6"}', 'C', NULL);
INSERT INTO public.questions VALUES (743, 31, 'Aşağıdakılardan hansı sözdə bütün saitlər incədir?', '{"A": "Kitab", "B": "Gül", "C": "Məktəb", "D": "Ana", "E": "Yol"}', 'C', NULL);
INSERT INTO public.questions VALUES (744, 31, 'Aşağıdakılardan hansı sözdə bütün saitlər qalındır?', '{"A": "Gəl", "B": "Get", "C": "Yol", "D": "Ev", "E": "Əl"}', 'C', NULL);
INSERT INTO public.questions VALUES (745, 31, '"Ş" hərfi hansı səsi bildirir?', '{"A": "Sait", "B": "Kar samit", "C": "Cingiltili samit", "D": "Yarımsait", "E": "Səssiz hərf"}', 'B', NULL);
INSERT INTO public.questions VALUES (746, 31, '"C" hərfi hansı səsi bildirir?', '{"A": "Sait", "B": "Kar samit", "C": "Cingiltili samit", "D": "Yarımsait", "E": "Səssiz hərf"}', 'C', NULL);
INSERT INTO public.questions VALUES (747, 31, '"Ata" sözündə neçə hərf və neçə səs var?', '{"A": "3 hərf, 3 səs", "B": "3 hərf, 2 səs", "C": "3 hərf, 4 səs", "D": "2 hərf, 3 səs", "E": "4 hərf, 3 səs"}', 'A', NULL);
INSERT INTO public.questions VALUES (748, 31, 'Hansı ifadə doğrudur?', '{"A": "Hər sözdə hərf sayı səs sayına bərabərdir", "B": "Sait səslər heca əmələ gətirir", "C": "Samit səslər heca əmələ gətirir", "D": "Azərbaycan dilində 6 samit səs var", "E": "Fonetika cümlə quruluşunu öyrənir"}', 'B', NULL);
INSERT INTO public.questions VALUES (749, 33, '[sa:t] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "sat", "B": "saat", "C": "sahat", "D": "sa:at", "E": "saət"}', 'B', NULL);
INSERT INTO public.questions VALUES (750, 33, '[ma:ş] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "maş", "B": "maaş", "C": "mağaş", "D": "maeş", "E": "ma:ş"}', 'B', NULL);
INSERT INTO public.questions VALUES (751, 33, '[cama:t] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "camat", "B": "camaat", "C": "cama:t", "D": "cəmaat", "E": "camağat"}', 'B', NULL);
INSERT INTO public.questions VALUES (752, 33, '[mə:llim] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "məllim", "B": "müəllim", "C": "mələlim", "D": "muəllim", "E": "məallim"}', 'B', NULL);
INSERT INTO public.questions VALUES (753, 33, '[müəllim] sözünün transkripsiyası necədir?', '{"A": "[müəllim]", "B": "[mə:llim]", "C": "[muellim]", "D": "[mü:llim]", "E": "[məllim]"}', 'B', NULL);
INSERT INTO public.questions VALUES (754, 33, '[saat] sözünün transkripsiyası necədir?', '{"A": "[saat]", "B": "[sa:t]", "C": "[sat]", "D": "[sahat]", "E": "[sə:at]"}', 'B', NULL);
INSERT INTO public.questions VALUES (755, 33, '[təəssüf] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "təssüf", "B": "təəssüf", "C": "təassüf", "D": "təəssuf", "E": "təssuf"}', 'B', NULL);
INSERT INTO public.questions VALUES (756, 33, '[müalicə] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "müalicə", "B": "mualicə", "C": "məalicə", "D": "müəlicə", "E": "mualice"}', 'A', NULL);
INSERT INTO public.questions VALUES (757, 33, '[ayilə] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "ailə", "B": "ayilə", "C": "aylə", "D": "əilə", "E": "aile"}', 'A', NULL);
INSERT INTO public.questions VALUES (758, 33, '[radiyo] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "radio", "B": "radiyo", "C": "radyo", "D": "radiio", "E": "radəo"}', 'A', NULL);
INSERT INTO public.questions VALUES (759, 33, '[şəhər] sözündə hansı samit tələffüzdə düşür?', '{"A": "ş", "B": "h", "C": "r", "D": "ə", "E": "heç biri"}', 'B', NULL);
INSERT INTO public.questions VALUES (760, 33, '[nefçi] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "nefçi", "B": "neftçi", "C": "neftşi", "D": "nəftçi", "E": "nefçi"}', 'B', NULL);
INSERT INTO public.questions VALUES (761, 33, '[dosluq] transkripsiyasına uyğun sözün düzgün yazılışı hansıdır?', '{"A": "dosluq", "B": "dostluq", "C": "dostluq", "D": "dosluq", "E": "dostluq"}', 'B', NULL);
INSERT INTO public.questions VALUES (762, 33, '[kitab] sözünün son samiti tələffüzdə necə deyilir?', '{"A": "b", "B": "p", "C": "t", "D": "d", "E": "k"}', 'B', NULL);
INSERT INTO public.questions VALUES (763, 33, '"Dörd" sözünün qədim mətnlərdə rast gəlinən və müasir yazılışa uyğun olmayan forması hansıdır?', '{"A": "dörd", "B": "dört", "C": "dord", "D": "döörd", "E": "dörrd"}', 'B', NULL);
INSERT INTO public.questions VALUES (764, 33, '"Qanad" sözünün qədim mətnlərdə rast gəlinən və müasir yazılışa uyğun olmayan forması hansıdır?', '{"A": "qanad", "B": "qanat", "C": "qanəd", "D": "qənad", "E": "qanat"}', 'B', NULL);
INSERT INTO public.questions VALUES (765, 33, '"Polad" sözünün qədim mətnlərdə rast gəlinən və müasir yazılışa uyğun olmayan forması hansıdır?', '{"A": "polad", "B": "polat", "C": "poləd", "D": "polat", "E": "pölad"}', 'B', NULL);
INSERT INTO public.questions VALUES (766, 33, '"İlan" sözünün qədim mətnlərdə rast gəlinən və müasir yazılışa uyğun olmayan forması hansıdır?', '{"A": "ilan", "B": "yılan", "C": "yilan", "D": "ilən", "E": "yılan"}', 'B', NULL);
INSERT INTO public.questions VALUES (767, 33, '"İndi" sözünün qədim mətnlərdə rast gəlinən və müasir yazılışa uyğun olmayan forması hansıdır?', '{"A": "indi", "B": "imdi", "C": "indı", "D": "əmdi", "E": "imdi"}', 'B', NULL);
INSERT INTO public.questions VALUES (768, 33, '"Uca" sözünün qədim mətnlərdə rast gəlinən və müasir yazılışa uyğun olmayan forması hansıdır?', '{"A": "uca", "B": "yuca", "C": "uça", "D": "yüca", "E": "yuca"}', 'B', NULL);
INSERT INTO public.questions VALUES (769, 33, 'Latın əlifbalı dillərdən alınan "taksi" sözünün düzgün yazılışı hansıdır?', '{"A": "taxi", "B": "taksi", "C": "taksy", "D": "taksi", "E": "təksi"}', 'B', NULL);
INSERT INTO public.questions VALUES (770, 33, '"Boks" sözünün düzgün yazılışı hansıdır?', '{"A": "box", "B": "boks", "C": "boks", "D": "boks", "E": "boks"}', 'B', NULL);
INSERT INTO public.questions VALUES (771, 33, '"Faks" sözünün düzgün yazılışı hansıdır?', '{"A": "fax", "B": "faks", "C": "faks", "D": "fəks", "E": "faks"}', 'B', NULL);
INSERT INTO public.questions VALUES (772, 33, 'Almanca "z" (tset) səsi ilə deyilən "Zitat" sözünün Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "zitat", "B": "sitat", "C": "tsitat", "D": "sitat", "E": "zitat"}', 'B', NULL);
INSERT INTO public.questions VALUES (773, 33, '"Sisterna" sözünün düzgün yazılışı hansıdır?', '{"A": "sisterna", "B": "sistern", "C": "cisterna", "D": "sistern", "E": "sistern"}', 'A', NULL);
INSERT INTO public.questions VALUES (774, 33, '"Sivil" sözünün düzgün yazılışı hansıdır?', '{"A": "civil", "B": "sivil", "C": "tsivil", "D": "sivəl", "E": "sivil"}', 'B', NULL);
INSERT INTO public.questions VALUES (775, 33, 'İngilis dilindəki "ch" hərf birləşməsi "ç" kimi deyilən "charter" sözünün Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "charter", "B": "çarter", "C": "şarter", "D": "çartər", "E": "çarter"}', 'B', NULL);
INSERT INTO public.questions VALUES (776, 33, '"Chile" sözünün Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "Chile", "B": "Çili", "C": "Şili", "D": "Çile", "E": "Çili"}', 'B', NULL);
INSERT INTO public.questions VALUES (777, 33, '"Chef" sözünün Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "chef", "B": "şef", "C": "çef", "D": "şef", "E": "çef"}', 'B', NULL);
INSERT INTO public.questions VALUES (778, 33, '"Shakespeare" adının Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "Shakespeare", "B": "Şekspir", "C": "Şekspir", "D": "Şekspir", "E": "Şekspir"}', 'B', NULL);
INSERT INTO public.questions VALUES (779, 33, '"Phoenix" sözünün Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "Phoenix", "B": "Feniks", "C": "Feniks", "D": "Feniks", "E": "Feniks"}', 'B', NULL);
INSERT INTO public.questions VALUES (780, 33, '"Philosophie" sözünün Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "philosophie", "B": "fəlsəfə", "C": "fəlsəfə", "D": "fəlsəfə", "E": "fəlsəfə"}', 'B', NULL);
INSERT INTO public.questions VALUES (781, 33, '"Mozart" adının Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "Mozart", "B": "Motsart", "C": "Motsart", "D": "Motsart", "E": "Motsart"}', 'B', NULL);
INSERT INTO public.questions VALUES (782, 33, '"Leibniz" adının Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "Leibniz", "B": "Leybnits", "C": "Leybnits", "D": "Leybnits", "E": "Leybnits"}', 'B', NULL);
INSERT INTO public.questions VALUES (783, 33, '"Zürich" adının Azərbaycan dilində düzgün yazılışı hansıdır?', '{"A": "Zürich", "B": "Sürix", "C": "Sürix", "D": "Sürix", "E": "Sürix"}', 'B', NULL);
INSERT INTO public.questions VALUES (784, 33, '"Qorki" adının sonunda "y" hərfi yazılırmı?', '{"A": "Bəli", "B": "Xeyr", "C": "Bəzən", "D": "Yalnız xüsusi isimlərdə", "E": "Yalnız ümumi isimlərdə"}', 'B', NULL);
INSERT INTO public.questions VALUES (785, 33, '"Ssenari" sözünün sonunda "y" hərfi yazılırmı?', '{"A": "Bəli", "B": "Xeyr", "C": "Bəzən", "D": "Yalnız xüsusi isimlərdə", "E": "Yalnız ümumi isimlərdə"}', 'B', NULL);
INSERT INTO public.questions VALUES (786, 33, '"Sanatori" sözünün sonunda "y" hərfi yazılırmı?', '{"A": "Bəli", "B": "Xeyr", "C": "Bəzən", "D": "Yalnız xüsusi isimlərdə", "E": "Yalnız ümumi isimlərdə"}', 'B', NULL);
INSERT INTO public.questions VALUES (787, 33, '"Dosent" sözünün düzgün yazılışı hansıdır?', '{"A": "dotsent", "B": "dosent", "C": "dosent", "D": "dosent", "E": "dosent"}', 'B', NULL);
INSERT INTO public.questions VALUES (788, 33, '"Konsert" sözünün düzgün yazılışı hansıdır?', '{"A": "kontserd", "B": "konsert", "C": "konsert", "D": "konsert", "E": "konsert"}', 'B', NULL);
INSERT INTO public.questions VALUES (789, 33, '"Sirk" sözünün düzgün yazılışı hansıdır?', '{"A": "cirk", "B": "sirk", "C": "tsirk", "D": "sirk", "E": "sirk"}', 'B', NULL);
INSERT INTO public.questions VALUES (790, 33, '"Sement" sözünün düzgün yazılışı hansıdır?', '{"A": "tsement", "B": "sement", "C": "sement", "D": "sement", "E": "sement"}', 'B', NULL);
INSERT INTO public.questions VALUES (791, 33, '"Lisey" sözünün düzgün yazılışı hansıdır?', '{"A": "litsey", "B": "lisey", "C": "lisey", "D": "lisey", "E": "lisey"}', 'B', NULL);
INSERT INTO public.questions VALUES (792, 33, '"Vitse" sözünün düzgün yazılışı hansıdır?', '{"A": "vitse", "B": "vitse", "C": "vitse", "D": "vitse", "E": "vitse"}', 'A', NULL);
INSERT INTO public.questions VALUES (793, NULL, 'Sinonim nədir?', '{"A": "Mənası əks olan sözlər", "B": "Mənası eyni və ya yaxın olan sözlər", "C": "Səsi eyni, mənası fərqli olan sözlər", "D": "Yazılışı eyni olan sözlər", "E": "Yalnız isim olan sözlər"}', 'B', NULL);
INSERT INTO public.questions VALUES (794, NULL, 'Antonim nədir?', '{"A": "Mənası eyni olan sözlər", "B": "Mənası əks olan sözlər", "C": "Səsi eyni olan sözlər", "D": "Yalnız sifət olan sözlər", "E": "Yalnız fel olan sözlər"}', 'B', NULL);
INSERT INTO public.questions VALUES (795, NULL, '"Gözəl" sözünün sinonimi hansıdır?', '{"A": "Çirkin", "B": "Qəşəng", "C": "Pis", "D": "Kiçik", "E": "Böyük"}', 'B', NULL);
INSERT INTO public.questions VALUES (797, NULL, '"Sürətli" sözünün antonimi hansıdır?', '{"A": "Cəld", "B": "Yeyin", "C": "İti", "D": "Yavaş", "E": "Tez"}', 'D', NULL);
INSERT INTO public.questions VALUES (798, NULL, '"Ağıllı" sözünün antonimi hansıdır?', '{"A": "Müdrik", "B": "Zəkalı", "C": "Ağılsız", "D": "Bilikli", "E": "Kamallı"}', 'C', NULL);
INSERT INTO public.questions VALUES (799, NULL, '"Xoşbəxt" sözünün antonimi hansıdır?', '{"A": "Bəxtiyar", "B": "Səadətli", "C": "Kədərli", "D": "Şad", "E": "Fərəhli"}', 'C', NULL);
INSERT INTO public.questions VALUES (800, NULL, '"Soyuq" sözünün antonimi hansıdır?', '{"A": "Buz", "B": "İsti", "C": "Sərin", "D": "Şaxta", "E": "Ayaz"}', 'B', NULL);
INSERT INTO public.questions VALUES (801, NULL, '"Uzaq" sözünün antonimi hansıdır?', '{"A": "Yaxın", "B": "İraq", "C": "Uzaqda", "D": "Kənar", "E": "Aralı"}', 'A', NULL);
INSERT INTO public.questions VALUES (802, NULL, '"Başlamaq" felinin antonimi hansıdır?', '{"A": "Başlamaq", "B": "Davam etmək", "C": "Bitirmək", "D": "Açmaq", "E": "Getmək"}', 'C', NULL);
INSERT INTO public.questions VALUES (803, NULL, '"Gəlmək" felinin antonimi hansıdır?', '{"A": "Getmək", "B": "Qayıtmaq", "C": "Yetişmək", "D": "Çatmaq", "E": "Yaxınlaşmaq"}', 'A', NULL);
INSERT INTO public.questions VALUES (804, NULL, '"Yuxarı" sözünün antonimi hansıdır?', '{"A": "Yuxarıda", "B": "Aşağı", "C": "Yüksək", "D": "Uca", "E": "Zirvə"}', 'B', NULL);
INSERT INTO public.questions VALUES (805, NULL, '"Doğru" sözünün antonimi hansıdır?', '{"A": "Düzgün", "B": "Haqlı", "C": "Yanlış", "D": "Həqiqi", "E": "Gerçək"}', 'C', NULL);
INSERT INTO public.questions VALUES (806, NULL, '"Yeni" sözünün antonimi hansıdır?', '{"A": "Təzə", "B": "Köhnə", "C": "Müasir", "D": "Yenilənmiş", "E": "Ən yeni"}', 'B', NULL);
INSERT INTO public.questions VALUES (807, NULL, '"Asan" sözünün antonimi hansıdır?', '{"A": "Sadə", "B": "Rahat", "C": "Çətin", "D": "Yüngül", "E": "Mümkün"}', 'C', NULL);
INSERT INTO public.questions VALUES (808, NULL, '"Təmiz" sözünün antonimi hansıdır?', '{"A": "Pak", "B": "Saf", "C": "Çirkli", "D": "Durulaşmış", "E": "Arınmış"}', 'C', NULL);
INSERT INTO public.questions VALUES (809, NULL, '"Sevmək" felinin antonimi hansıdır?', '{"A": "Nifrət etmək", "B": "Bəyənmək", "C": "Xoşlamaq", "D": "Rəğbət bəsləmək", "E": "Ürəyi yanmaq"}', 'A', NULL);
INSERT INTO public.questions VALUES (810, NULL, '"Güclü" sözünün antonimi hansıdır?', '{"A": "Qüvvətli", "B": "Zorba", "C": "Zəif", "D": "Möhkəm", "E": "Davamlı"}', 'C', NULL);
INSERT INTO public.questions VALUES (811, NULL, '"Danışmaq" felinin sinonimi hansıdır?', '{"A": "Susmaq", "B": "Söyləmək", "C": "Dinmək", "D": "Qulaq asmaq", "E": "Kəsmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (812, NULL, '"Ev" sözünün sinonimi hansıdır?', '{"A": "Küçə", "B": "Məscid", "C": "Mənzil", "D": "Yol", "E": "Şəhər"}', 'C', NULL);
INSERT INTO public.questions VALUES (813, NULL, '"Kədər" sözünün antonimi hansıdır?', '{"A": "Qəm", "B": "Hüzn", "C": "Sevinc", "D": "Dərd", "E": "Əzab"}', 'C', NULL);
INSERT INTO public.questions VALUES (814, NULL, '"Ayıq" sözünün antonimi hansıdır?', '{"A": "Sərxoş", "B": "Oyaq", "C": "Diqqətli", "D": "Sayıq", "E": "Huşlu"}', 'A', NULL);
INSERT INTO public.questions VALUES (815, NULL, '"Ağlamaq" felinin antonimi hansıdır?', '{"A": "Göz yaş tökmək", "B": "Gülmək", "C": "Hönkürmək", "D": "Sızıldamaq", "E": "Fəryad etmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (816, NULL, '"Cəsarətli" sözünün antonimi hansıdır?', '{"A": "Ürəkli", "B": "Qorxaq", "C": "İgid", "D": "Mərd", "E": "Qoçaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (817, NULL, '"Qara" sözünün antonimi hansıdır?', '{"A": "Tünd", "B": "Ağ", "C": "Boz", "D": "Rəngli", "E": "Sarı"}', 'B', NULL);
INSERT INTO public.questions VALUES (818, NULL, '"Ac" sözünün antonimi hansıdır?', '{"A": "Tox", "B": "Aclıq", "C": "Susuz", "D": "Yeməksiz", "E": "Qarnı boş"}', 'A', NULL);
INSERT INTO public.questions VALUES (819, NULL, '"Açmaq" felinin antonimi hansıdır?', '{"A": "Örtmək", "B": "Bağlamaq", "C": "Açmaq", "D": "Çözmək", "E": "Aralamaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (820, NULL, '"Dost" sözünün antonimi hansıdır?', '{"A": "Yoldaş", "B": "Ər", "C": "Arvad", "D": "Düşmən", "E": "Qardaş"}', 'D', NULL);
INSERT INTO public.questions VALUES (821, 37, '"Başına dəymək" frazeoloji ifadəsinin mənası nədir?', '{"A": "Kimisə sevindirmək", "B": "Kimisə cəzalandırmaq və ya pis vəziyyətə salmaq", "C": "Kimisə tərifləmək", "D": "Kiməsə kömək etmək", "E": "Kimisə yola salmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (822, 37, '"Ürəyi düşmək" ifadəsinin mənası nədir?', '{"A": "Qorxmaq", "B": "Sevmək, bəyənmək", "C": "Acmaq", "D": "Ürəyi xəstələnmək", "E": "Darıxmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (823, 37, '"Dilə düşmək" ifadəsi nə deməkdir?', '{"A": "Danışmaq", "B": "Söz-söhbətə səbəb olmaq, məşhurlaşmaq", "C": "Susmaq", "D": "Ağıl öyrətmək", "E": "Yuxuya getmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (824, 37, '"Baş açmamaq" ifadəsi nəyi bildirir?', '{"A": "Saçını daramaq", "B": "Bir işi anlaya bilməmək, bacarmamaq", "C": "Baş ağrısı çəkmək", "D": "Şapka taxmamaq", "E": "Güzgüyə baxmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (825, 37, '"Göz açmaq" frazeologizminin mənası nədir?', '{"A": "Yuxudan oyanmaq", "B": "Dünyaya gəlmək və ya bir həqiqəti dərk etmək", "C": "Gözlərini böyütmək", "D": "Ağlamaq", "E": "Kor olmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (826, 37, '"Əli çatmamaq" ifadəsi hansı mənanı verir?', '{"A": "Uzaqda olmaq", "B": "İmkanı olmamaq, vaxt tapa bilməmək", "C": "Əlini qaldırmamaq", "D": "Əl sıxmamaq", "E": "Bir yerdən getmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (827, 37, '"Dilinə gəlmək" ifadəsinin mənası nədir?', '{"A": "Danışmağa başlamaq, demək istədiyini söyləmək", "B": "Dilini dişləmək", "C": "Susmaq", "D": "Yalan danışmaq", "E": "Ağız açmamaq"}', 'A', NULL);
INSERT INTO public.questions VALUES (828, 37, '"Canını qurtarmaq" ifadəsi nə deməkdir?', '{"A": "Ölmək", "B": "Xilas olmaq, təhlükədən qurtulmaq", "C": "Xəstələnmək", "D": "Yorulmaq", "E": "Yuxulamaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (829, 37, '"Ağzı açıq qalmaq" frazeoloji ifadəsi hansı mənanı bildirir?', '{"A": "Ac qalmaq", "B": "Təəccüblənmək, heyrətlənmək", "C": "Danışa bilməmək", "D": "Yemək yeməmək", "E": "Ağız xəstəliyi keçirmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (830, 37, '"Qulaq asmamaq" ifadəsinin mənası nədir?', '{"A": "Eşitməmək", "B": "Diqqət yetirməmək, saymamazlıq etmək", "C": "Səsi azaltmaq", "D": "Qulağı ağrımaq", "E": "Yuxuya getmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (831, 37, '"Ürəyi yerinə düşmək" ifadəsi nəyi bildirir?', '{"A": "Qorxmaq", "B": "Arxayın olmaq, rahatlanmaq", "C": "Ürək xəstəliyi keçirmək", "D": "Sevinmək", "E": "Yorulmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (832, 37, '"Gözü doymaq" frazeologizminin mənası nədir?', '{"A": "Ac qalmaq", "B": "Yetərincə görmək, razı qalmaq", "C": "Gözləri yorulmaq", "D": "Gözlərini yummaq", "E": "Kor olmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (833, 37, '"Əl vurmaq" ifadəsi hansı mənanı verir?', '{"A": "Əl sıxmaq", "B": "Bir işə başlamaq, toxunmaq", "C": "Əlini yumaq", "D": "Əl qaldırmaq", "E": "Əl çəkmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (834, 37, '"Dil uzatmaq" ifadəsi nə deməkdir?', '{"A": "Danışmaq", "B": "Kimisə lağ etmək, tənqid etmək", "C": "Dilini çıxarmaq", "D": "Yaltaqlanmaq", "E": "Susmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (835, 37, '"Başı lovğa olmaq" ifadəsinin mənası nədir?', '{"A": "Ağıllı olmaq", "B": "Təkəbbürlü, özünü bəyənən olmaq", "C": "Başı ağrımaq", "D": "Səfeh olmaq", "E": "Utancaq olmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (836, 37, '"Göz qoymaq" frazeoloji ifadəsi hansı mənanı bildirir?', '{"A": "Baxmaq", "B": "Kiminsə malına həris olmaq, istəmək", "C": "Gözünü bağlamaq", "D": "Yuxulamaq", "E": "Ağlamaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (837, 37, '"Ayağa qalxmaq" ifadəsinin mənası nədir?', '{"A": "Yatmaq", "B": "Ayaq üstə durmaq və ya mübarizəyə başlamaq", "C": "Yerə oturmaq", "D": "Qaçmaq", "E": "Yıxılmaq"}', 'B', NULL);
INSERT INTO public.questions VALUES (838, 37, '"Damaq qurutmaq" ifadəsi nəyi bildirir?', '{"A": "Su içmək", "B": "Heç nə yeməmək, ac qalmaq", "C": "Ağız qurutmaq", "D": "Danışmaq", "E": "Yemək yemək"}', 'B', NULL);
INSERT INTO public.questions VALUES (839, 37, '"Əli açıq olmaq" frazeologizminin mənası nədir?', '{"A": "Səxavətli olmaq", "B": "Əlini açmaq", "C": "Yoxsul olmaq", "D": "Xəsis olmaq", "E": "Əlini yumaq"}', 'A', NULL);
INSERT INTO public.questions VALUES (840, 37, '"Can vermək" ifadəsi hansı mənanı verir?', '{"A": "Həyat vermək, ölmək", "B": "Yorulmaq", "C": "Xəstələnmək", "D": "Sevgi göstərmək", "E": "Yemək vermək"}', 'A', NULL);
INSERT INTO public.questions VALUES (841, 37, '"Gözü qorxmaq" ifadəsinin mənası nədir?', '{"A": "Cəsarətli olmaq", "B": "Qorxuya düşmək, çəkinmək", "C": "Gözlərini yummaq", "D": "Ağlamaq", "E": "Gülmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (842, 37, '"Başını itirmək" frazeoloji ifadəsi nə deməkdir?', '{"A": "Saçını kəsmək", "B": "Ağılsız hərəkət etmək, çaşmaq", "C": "Yuxuya getmək", "D": "Uşaqlıq etmək", "E": "Ölmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (843, 37, '"Ürəyi getmək" ifadəsinin mənası nədir?', '{"A": "Qorxmaq", "B": "Bir şeyi çox istəmək, həvəslənmək", "C": "Ürək xəstəliyi keçirmək", "D": "Yorulmaq", "E": "Ölmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (844, 37, '"Dilini dişləmək" ifadəsi nəyi bildirir?', '{"A": "Danışmamaq, peşman olmaq", "B": "Diş ağrısı çəkmək", "C": "Danışmağa başlamaq", "D": "Dilini göstərmək", "E": "Yaltaqlanmaq"}', 'A', NULL);
INSERT INTO public.questions VALUES (845, 39, 'İsim nədir?', '{"A": "Əşya, canlı, yer, anlayış adlarını bildirən nitq hissəsi", "B": "Hərəkəti bildirən nitq hissəsi", "C": "Əlaməti bildirən nitq hissəsi", "D": "Sayı bildirən nitq hissəsi", "E": "Əvəzlik"}', 'A', NULL);
INSERT INTO public.questions VALUES (846, 39, 'Sifət nədir?', '{"A": "Əşya adını bildirən nitq hissəsi", "B": "Hərəkəti bildirən nitq hissəsi", "C": "Əşyanın əlamətini, keyfiyyətini bildirən nitq hissəsi", "D": "Sayı bildirən nitq hissəsi", "E": "Zərf"}', 'C', NULL);
INSERT INTO public.questions VALUES (847, 39, 'Aşağıdakılardan hansı isimdir?', '{"A": "gözəl", "B": "kitab", "C": "tez", "D": "yazmaq", "E": "beş"}', 'B', NULL);
INSERT INTO public.questions VALUES (848, 39, 'Aşağıdakılardan hansı sifətdir?', '{"A": "kitab", "B": "qələm", "C": "gözəl", "D": "yazmaq", "E": "oxumaq"}', 'C', NULL);
INSERT INTO public.questions VALUES (849, 39, '"Kitab" sözü hansı suala cavab verir?', '{"A": "Necə?", "B": "Nə?", "C": "Nə qədər?", "D": "Harada?", "E": "Niyə?"}', 'B', NULL);
INSERT INTO public.questions VALUES (850, 39, '"Gözəl" sözü hansı suala cavab verir?', '{"A": "Nə?", "B": "Kim?", "C": "Necə?", "D": "Nə qədər?", "E": "Harada?"}', 'C', NULL);
INSERT INTO public.questions VALUES (851, 39, 'İsimlər hansı qruplara bölünür?', '{"A": "Yalnız xüsusi və ümumi", "B": "Xüsusi və ümumi, konkret və mücərrəd, sadə və düzəltmə", "C": "Yalnız tək və cəm", "D": "Yalnız sadə və mürəkkəb", "E": "Yalnız canlı və cansız"}', 'B', NULL);
INSERT INTO public.questions VALUES (852, 39, '"Bakı" sözü hansı isim növünə aiddir?', '{"A": "Ümumi isim", "B": "Xüsusi isim", "C": "Mücərrəd isim", "D": "Cəm isim", "E": "Düzəltmə isim"}', 'B', NULL);
INSERT INTO public.questions VALUES (853, 39, '"Şəhər" sözü hansı isim növünə aiddir?', '{"A": "Xüsusi isim", "B": "Ümumi isim", "C": "Mücərrəd isim", "D": "Tək isim", "E": "Düzəltmə isim"}', 'B', NULL);
INSERT INTO public.questions VALUES (854, 39, '"Sevgi" sözü hansı isim növünə aiddir?', '{"A": "Konkret isim", "B": "Mücərrəd isim", "C": "Xüsusi isim", "D": "Cəm isim", "E": "Düzəltmə isim"}', 'B', NULL);
INSERT INTO public.questions VALUES (855, 39, '"Uşaqlar" sözü hansı formadadır?', '{"A": "Tək", "B": "Cəm", "C": "Xüsusi", "D": "Mücərrəd", "E": "Düzəltmə"}', 'B', NULL);
INSERT INTO public.questions VALUES (856, 39, 'Aşağıdakılardan hansı cəm isimdir?', '{"A": "kitab", "B": "qələm", "C": "uşaqlar", "D": "stol", "E": "ev"}', 'C', NULL);
INSERT INTO public.questions VALUES (857, 39, '"Daş" sözündən isim düzəldən şəkilçi hansıdır?', '{"A": "-lıq", "B": "-çı", "C": "-sız", "D": "-lı", "E": "-cıq"}', 'B', NULL);
INSERT INTO public.questions VALUES (858, 39, '"Dəmirçi" sözü hansı üsulla düzəlib?', '{"A": "Şəkilçi ilə", "B": "Söz birləşməsi ilə", "C": "Kök söz", "D": "Əvəzlik", "E": "Sifət"}', 'A', NULL);
INSERT INTO public.questions VALUES (859, 39, '"Qələm" sözü hansı isim növünə aiddir?', '{"A": "Xüsusi", "B": "Ümumi", "C": "Mücərrəd", "D": "Cəm", "E": "Düzəltmə"}', 'B', NULL);
INSERT INTO public.questions VALUES (860, 39, '"Zəhmət" sözü hansı isim növünə aiddir?', '{"A": "Konkret", "B": "Mücərrəd", "C": "Xüsusi", "D": "Cəm", "E": "Düzəltmə"}', 'B', NULL);
INSERT INTO public.questions VALUES (861, 39, 'Sifətlər məna baxımından neçə yerə bölünür?', '{"A": "2 (keyfiyyət və nisbi)", "B": "3", "C": "4", "D": "5", "E": "6"}', 'A', NULL);
INSERT INTO public.questions VALUES (862, 39, '"Qırmızı" sifəti hansı növ sifətdir?', '{"A": "Nisbi sifət", "B": "Keyfiyyət sifəti", "C": "Say sifəti", "D": "Əvəzlik sifət", "E": "Zərf"}', 'B', NULL);
INSERT INTO public.questions VALUES (863, 39, '"Daş" sifəti hansı növ sifətdir?', '{"A": "Keyfiyyət sifəti", "B": "Nisbi sifət", "C": "Say sifəti", "D": "Əvəzlik sifət", "E": "Zərf"}', 'B', NULL);
INSERT INTO public.questions VALUES (864, 39, '"Gözəl" sifətinin gücləndirilmiş forması hansıdır?', '{"A": "Çox gözəl", "B": "Gözəlcə", "C": "Gözəllik", "D": "Gözəlləşmək", "E": "Gözəl-gözəl"}', 'A', NULL);
INSERT INTO public.questions VALUES (865, 39, '"Ağ" sözünün antonimi hansıdır?', '{"A": "Qara", "B": "Sarı", "C": "Yaşıl", "D": "Mavi", "E": "Qırmızı"}', 'A', NULL);
INSERT INTO public.questions VALUES (866, 39, '"Böyük" sifətinin antonimi hansıdır?', '{"A": "Kiçik", "B": "Uca", "C": "Nəhəng", "D": "Geniş", "E": "Hündür"}', 'A', NULL);
INSERT INTO public.questions VALUES (867, 39, '"Yaxşı" sifətinin antonimi hansıdır?', '{"A": "Pis", "B": "Gözəl", "C": "Əla", "D": "Mükəmməl", "E": "Zəif"}', 'A', NULL);
INSERT INTO public.questions VALUES (868, 39, '"Şirin" sifətinin antonimi hansıdır?', '{"A": "Duzlu", "B": "Acı", "C": "Turş", "D": "Dadlı", "E": "İsti"}', 'B', NULL);
INSERT INTO public.questions VALUES (869, 39, '"Sürətli" sifətinin antonimi hansıdır?', '{"A": "Cəld", "B": "Yavaş", "C": "İti", "D": "Yeyin", "E": "Tez"}', 'B', NULL);
INSERT INTO public.questions VALUES (870, 39, '"Soyuq" sifətinin antonimi hansıdır?', '{"A": "İsti", "B": "Sərin", "C": "Ayaz", "D": "Şaxta", "E": "Buz"}', 'A', NULL);
INSERT INTO public.questions VALUES (871, 39, 'Aşağıdakılardan hansı sifətdir?', '{"A": "qaçmaq", "B": "gözəllik", "C": "gözəl", "D": "gözəlcə", "E": "gözəlləşmək"}', 'C', NULL);
INSERT INTO public.questions VALUES (872, 39, 'Aşağıdakılardan hansı isimdir?', '{"A": "gözəl", "B": "gözəllik", "C": "gözəlcə", "D": "gözəl-gözəl", "E": "gözəlləşmək"}', 'B', NULL);
INSERT INTO public.questions VALUES (873, 39, '"Qırmızı" sözü cümlədə hansı sintaktik rolu oynayır?', '{"A": "Mübtəda", "B": "Xəbər", "C": "Təyin", "D": "Zərflik", "E": "Tamamlıq"}', 'C', NULL);
INSERT INTO public.questions VALUES (874, 39, '"Kitab" sözü cümlədə hansı sintaktik rolu oynayır?', '{"A": "Mübtəda", "B": "Xəbər", "C": "Təyin", "D": "Zərflik", "E": "Tamamlıq"}', 'A', NULL);
INSERT INTO public.questions VALUES (875, 39, '"Mavi" sifəti hansı növ sifətdir?', '{"A": "Nisbi sifət", "B": "Keyfiyyət sifəti", "C": "Say sifəti", "D": "Əvəzlik sifət", "E": "Zərf"}', 'B', NULL);
INSERT INTO public.questions VALUES (876, 39, '"Şəhər" sözü hansı isim növünə aiddir?', '{"A": "Xüsusi", "B": "Ümumi", "C": "Mücərrəd", "D": "Cəm", "E": "Düzəltmə"}', 'B', NULL);
INSERT INTO public.questions VALUES (877, 39, '"Uşaqlıq" sözü hansı isim növünə aiddir?', '{"A": "Konkret", "B": "Mücərrəd", "C": "Xüsusi", "D": "Cəm", "E": "Düzəltmə"}', 'B', NULL);
INSERT INTO public.questions VALUES (878, 39, '"Gözəl" sifətinin isim forması hansıdır?', '{"A": "gözəl", "B": "gözəllik", "C": "gözəlcə", "D": "gözəlləşmək", "E": "gözəl-gözəl"}', 'B', NULL);
INSERT INTO public.questions VALUES (918, 41, '"Gəlmədən" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (879, 41, 'Feil nədir?', '{"A": "Əşya adını bildirən nitq hissəsi", "B": "Hərəkəti, işi, vəziyyəti bildirən nitq hissəsi", "C": "Əlaməti bildirən nitq hissəsi", "D": "Sayı bildirən nitq hissəsi", "E": "Əvəzlik"}', 'B', NULL);
INSERT INTO public.questions VALUES (880, 41, 'Aşağıdakılardan hansı feildir?', '{"A": "kitab", "B": "gözəl", "C": "yazmaq", "D": "beş", "E": "tez"}', 'C', NULL);
INSERT INTO public.questions VALUES (881, 41, '"Yazmaq" sözü hansı suala cavab verir?', '{"A": "Nə?", "B": "Necə?", "C": "Nə etmək?", "D": "Nə qədər?", "E": "Harada?"}', 'C', NULL);
INSERT INTO public.questions VALUES (882, 41, 'Feillər hansı qruplara bölünür?', '{"A": "Yalnız tək və cəm", "B": "Sadə və mürəkkəb, düzəltmə və birləşmə", "C": "Yalnız keçidli və keçidsiz", "D": "Yalnız təsriflənən və təsriflənməyən", "E": "Yalnız müsbət və mənfi"}', 'D', NULL);
INSERT INTO public.questions VALUES (883, 41, 'Feilin hansı formaları təsriflənir?', '{"A": "Məsdər, feli sifət, feli bağlama", "B": "Şəxs və zamana görə dəyişən formalar", "C": "Yalnız məsdər", "D": "Yalnız feli sifət", "E": "Yalnız feli bağlama"}', 'B', NULL);
INSERT INTO public.questions VALUES (884, 41, 'Təsriflənməyən feil formaları hansılardır?', '{"A": "Şəxs və zamana görə dəyişən feillər", "B": "Məsdər, feli sifət, feli bağlama", "C": "Yalnız keçidli feillər", "D": "Yalnız keçidsiz feillər", "E": "Yalnız mürəkkəb feillər"}', 'B', NULL);
INSERT INTO public.questions VALUES (885, 41, 'Məsdər nədir?', '{"A": "Feilin şəxs və zamana görə dəyişən forması", "B": "Feilin -maq, -mək şəkilçisi ilə düzələn, hərəkətin adını bildirən forması", "C": "Feilin sifət forması", "D": "Feilin zərf forması", "E": "İsim"}', 'B', NULL);
INSERT INTO public.questions VALUES (886, 41, '"Oxumaq" sözü hansı formadadır?', '{"A": "Feli sifət", "B": "Feli bağlama", "C": "Məsdər", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (887, 41, '"Oxuyan" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'B', NULL);
INSERT INTO public.questions VALUES (888, 41, '"Oxuyaraq" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (889, 41, 'Feli sifət nədir?', '{"A": "Feilin -maq, -mək şəkilçisi ilə düzələn forması", "B": "Feilin -an, -ən, -mış, -miş, -acaq, -əcək şəkilçiləri ilə düzələn, əlamət bildirən forması", "C": "Feilin -araq, -ərək şəkilçisi ilə düzələn forması", "D": "Şəxs və zamana görə dəyişən feil", "E": "İsim"}', 'B', NULL);
INSERT INTO public.questions VALUES (890, 41, 'Feli bağlama nədir?', '{"A": "Feilin -maq, -mək şəkilçisi ilə düzələn forması", "B": "Feilin -an, -ən şəkilçisi ilə düzələn forması", "C": "Feilin -araq, -ərək, -ıb, -ib, -madan, -mədən şəkilçiləri ilə düzələn, əlavə hərəkət bildirən forması", "D": "Şəxs və zamana görə dəyişən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (891, 41, '"Gələn" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'B', NULL);
INSERT INTO public.questions VALUES (892, 41, '"Gələrək" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (893, 41, '"Gəlmək" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'A', NULL);
INSERT INTO public.questions VALUES (894, 41, '"Yazılmış" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'B', NULL);
INSERT INTO public.questions VALUES (895, 41, '"Yazaraq" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (896, 41, '"Yazmaq" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'A', NULL);
INSERT INTO public.questions VALUES (897, 41, 'Feli sifət cümlədə hansı sintaktik rolu oynayır?', '{"A": "Mübtəda", "B": "Xəbər", "C": "Təyin", "D": "Zərflik", "E": "Tamamlıq"}', 'C', NULL);
INSERT INTO public.questions VALUES (898, 41, 'Feli bağlama cümlədə hansı sintaktik rolu oynayır?', '{"A": "Mübtəda", "B": "Xəbər", "C": "Təyin", "D": "Zərflik", "E": "Tamamlıq"}', 'D', NULL);
INSERT INTO public.questions VALUES (899, 41, 'Məsdər cümlədə hansı sintaktik rolu oynayır?', '{"A": "Mübtəda, xəbər, tamamlıq və s.", "B": "Yalnız təyin", "C": "Yalnız zərflik", "D": "Yalnız mübtəda", "E": "Yalnız xəbər"}', 'A', NULL);
INSERT INTO public.questions VALUES (900, 41, '"Oxuyan uşaq" ifadəsində "oxuyan" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'B', NULL);
INSERT INTO public.questions VALUES (901, 41, '"Oxuyaraq gəldi" cümləsində "oxuyaraq" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (902, 41, '"Oxumaq faydalıdır" cümləsində "oxumaq" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'A', NULL);
INSERT INTO public.questions VALUES (903, 41, 'Aşağıdakılardan hansı feli sifətdir?', '{"A": "oxumaq", "B": "oxuyan", "C": "oxuyaraq", "D": "oxuyur", "E": "oxudu"}', 'B', NULL);
INSERT INTO public.questions VALUES (904, 41, 'Aşağıdakılardan hansı feli bağlamadır?', '{"A": "gəlmək", "B": "gələn", "C": "gələrək", "D": "gəlir", "E": "gəldi"}', 'C', NULL);
INSERT INTO public.questions VALUES (905, 41, 'Aşağıdakılardan hansı məsdərdir?', '{"A": "yazmaq", "B": "yazan", "C": "yazaraq", "D": "yazır", "E": "yazdı"}', 'A', NULL);
INSERT INTO public.questions VALUES (906, 41, '"Gülən" sözü hansı şəkilçi ilə düzəlib?', '{"A": "-maq", "B": "-an", "C": "-araq", "D": "-ır", "E": "-dı"}', 'B', NULL);
INSERT INTO public.questions VALUES (907, 41, '"Gülərək" sözü hansı şəkilçi ilə düzəlib?', '{"A": "-maq", "B": "-ən", "C": "-ərək", "D": "-ir", "E": "-di"}', 'C', NULL);
INSERT INTO public.questions VALUES (908, 41, '"Gülmək" sözü hansı şəkilçi ilə düzəlib?', '{"A": "-maq", "B": "-ən", "C": "-ərək", "D": "-ir", "E": "-di"}', 'A', NULL);
INSERT INTO public.questions VALUES (909, 41, 'Feli sifətin qədim şəkli hansıdır?', '{"A": "-an, -ən", "B": "-mış, -miş", "C": "-acaq, -əcək", "D": "-dıq, -dik", "E": "-ar, -ər"}', 'A', NULL);
INSERT INTO public.questions VALUES (910, 41, '"Yazıb" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (911, 41, '"Yazmadan" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (912, 41, '"Yazacaq" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'B', NULL);
INSERT INTO public.questions VALUES (913, 41, '"Yazdı" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'D', NULL);
INSERT INTO public.questions VALUES (914, 41, 'Aşağıdakılardan hansı təsriflənməyən feil formasıdır?', '{"A": "yazır", "B": "yazdı", "C": "yazacaq", "D": "yazmaq", "E": "yazmışam"}', 'D', NULL);
INSERT INTO public.questions VALUES (915, 41, 'Aşağıdakılardan hansı təsriflənən feil formasıdır?', '{"A": "yazmaq", "B": "yazan", "C": "yazaraq", "D": "yazır", "E": "yazıb"}', 'D', NULL);
INSERT INTO public.questions VALUES (916, 41, '"Gələcək" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'B', NULL);
INSERT INTO public.questions VALUES (917, 41, '"Gəlib" sözü hansı formadadır?', '{"A": "Məsdər", "B": "Feli sifət", "C": "Feli bağlama", "D": "Təsriflənən feil", "E": "İsim"}', 'C', NULL);
INSERT INTO public.questions VALUES (919, 43, 'Cümlənin baş üzvləri hansılardır?', '{"A": "Mübtəda və tamamlıq", "B": "Mübtəda və xəbər", "C": "Xəbər və təyin", "D": "Tamamlıq və zərflik", "E": "Təyin və zərflik"}', 'B', NULL);
INSERT INTO public.questions VALUES (920, 43, 'Cümlənin ikinci dərəcəli üzvləri hansılardır?', '{"A": "Mübtəda və xəbər", "B": "Tamamlıq, təyin və zərflik", "C": "Yalnız tamamlıq", "D": "Yalnız təyin", "E": "Yalnız zərflik"}', 'B', NULL);
INSERT INTO public.questions VALUES (921, 43, 'Mübtəda nədir?', '{"A": "Hərəkəti bildirən üzv", "B": "Cümlədə xəbərin bildirdiyi işi görən və ya vəziyyətdə olan şəxs və ya əşya", "C": "Əşyanın əlamətini bildirən üzv", "D": "Hərəkətin yerini bildirən üzv", "E": "Hərəkətin obyektini bildirən üzv"}', 'B', NULL);
INSERT INTO public.questions VALUES (922, 43, 'Xəbər nədir?', '{"A": "Cümlədə işi görən şəxs", "B": "Mübtədanın etdiyi işi, hərəkəti və ya vəziyyəti bildirən üzv", "C": "Əşyanın əlaməti", "D": "Hərəkətin yeri", "E": "Hərəkətin obyekti"}', 'B', NULL);
INSERT INTO public.questions VALUES (923, 43, 'Mübtəda hansı suallara cavab verir?', '{"A": "Nə etdi? Nə oldu?", "B": "Kim? Nə?", "C": "Necə? Nə cür?", "D": "Harada? Nə vaxt?", "E": "Nə üçün? Niyə?"}', 'B', NULL);
INSERT INTO public.questions VALUES (924, 43, 'Xəbər hansı suallara cavab verir?', '{"A": "Kim? Nə?", "B": "Nə etdi? Nə edir? Nə edəcək? Necədir?", "C": "Necə? Nə cür?", "D": "Harada? Nə vaxt?", "E": "Nə üçün? Niyə?"}', 'B', NULL);
INSERT INTO public.questions VALUES (925, 43, '"Uşaq kitab oxuyur" cümləsində mübtəda hansı sözdür?', '{"A": "Uşaq", "B": "kitab", "C": "oxuyur", "D": "kitab oxuyur", "E": "Uşaq oxuyur"}', 'A', NULL);
INSERT INTO public.questions VALUES (926, 43, '"Uşaq kitab oxuyur" cümləsində xəbər hansı sözdür?', '{"A": "Uşaq", "B": "kitab", "C": "oxuyur", "D": "kitab oxuyur", "E": "Uşaq kitab"}', 'C', NULL);
INSERT INTO public.questions VALUES (927, 43, '"Günəş parlayır" cümləsində mübtəda hansı sözdür?', '{"A": "Günəş", "B": "parlayır", "C": "Günəş parlayır", "D": "parla", "E": "Günəşdir"}', 'A', NULL);
INSERT INTO public.questions VALUES (928, 43, '"Günəş parlayır" cümləsində xəbər hansı sözdür?', '{"A": "Günəş", "B": "parlayır", "C": "Günəş parlayır", "D": "parla", "E": "Günəşdir"}', 'B', NULL);
INSERT INTO public.questions VALUES (929, 43, 'Tamamlıq nədir?', '{"A": "Hərəkəti bildirən üzv", "B": "Cümlədə hərəkətin obyektini, vasitəsini və ya istiqamətini bildirən ikinci dərəcəli üzv", "C": "Əşyanın əlamətini bildirən üzv", "D": "Hərəkətin yerini bildirən üzv", "E": "Cümlənin baş üzvü"}', 'B', NULL);
INSERT INTO public.questions VALUES (930, 43, 'Tamamlıq hansı suallara cavab verir?', '{"A": "Kim? Nə?", "B": "Kimi? Nəyi? Kimə? Nəyə? Kimdə? Nədə? Kimdən? Nədən?", "C": "Necə? Nə cür?", "D": "Harada? Nə vaxt?", "E": "Nə üçün? Niyə?"}', 'B', NULL);
INSERT INTO public.questions VALUES (931, 43, '"Uşaq kitabı oxuyur" cümləsində tamamlıq hansı sözdür?', '{"A": "Uşaq", "B": "kitabı", "C": "oxuyur", "D": "kitabı oxuyur", "E": "Uşaq kitabı"}', 'B', NULL);
INSERT INTO public.questions VALUES (932, 43, '"Mən dostuma məktub yazdım" cümləsində tamamlıq hansı sözlərdir?', '{"A": "Mən", "B": "dostuma, məktub", "C": "yazdım", "D": "Mən yazdım", "E": "dostuma yazdım"}', 'B', NULL);
INSERT INTO public.questions VALUES (933, 43, 'Təyin nədir?', '{"A": "Hərəkəti bildirən üzv", "B": "Əşyanın əlamətini, keyfiyyətini, sayını və s. bildirən ikinci dərəcəli üzv", "C": "Hərəkətin obyektini bildirən üzv", "D": "Hərəkətin yerini bildirən üzv", "E": "Cümlənin baş üzvü"}', 'B', NULL);
INSERT INTO public.questions VALUES (934, 43, 'Təyin hansı suallara cavab verir?', '{"A": "Kim? Nə?", "B": "Necə? Nə cür? Hansı? Neçə? Nə qədər?", "C": "Kimi? Nəyi?", "D": "Harada? Nə vaxt?", "E": "Nə üçün? Niyə?"}', 'B', NULL);
INSERT INTO public.questions VALUES (935, 43, '"Qırmızı gül açıldı" cümləsində təyin hansı sözdür?', '{"A": "Qırmızı", "B": "gül", "C": "açıldı", "D": "Qırmızı gül", "E": "gül açıldı"}', 'A', NULL);
INSERT INTO public.questions VALUES (936, 43, '"Mən iki kitab aldım" cümləsində təyin hansı sözdür?', '{"A": "Mən", "B": "iki", "C": "kitab", "D": "aldım", "E": "iki kitab"}', 'B', NULL);
INSERT INTO public.questions VALUES (937, 43, 'Zərflik nədir?', '{"A": "Hərəkəti bildirən üzv", "B": "Hərəkətin yerini, vaxtını, səbəbini, məqsədini, tərzini bildirən ikinci dərəcəli üzv", "C": "Əşyanın əlamətini bildirən üzv", "D": "Hərəkətin obyektini bildirən üzv", "E": "Cümlənin baş üzvü"}', 'B', NULL);
INSERT INTO public.questions VALUES (938, 43, 'Zərflik hansı suallara cavab verir?', '{"A": "Kim? Nə?", "B": "Harada? Nə vaxt? Necə? Niyə? Nə üçün?", "C": "Kimi? Nəyi?", "D": "Necə? Nə cür? Hansı?", "E": "Kimə? Nəyə?"}', 'B', NULL);
INSERT INTO public.questions VALUES (939, 43, '"Uşaq məktəbə getdi" cümləsində zərflik hansı sözdür?', '{"A": "Uşaq", "B": "məktəbə", "C": "getdi", "D": "Uşaq getdi", "E": "məktəbə getdi"}', 'B', NULL);
INSERT INTO public.questions VALUES (940, 43, '"Dünən yağış yağdı" cümləsində zərflik hansı sözdür?', '{"A": "Dünən", "B": "yağış", "C": "yağdı", "D": "Dünən yağış", "E": "yağış yağdı"}', 'A', NULL);
INSERT INTO public.questions VALUES (941, 43, '"Tez gəldi" cümləsində zərflik hansı sözdür?', '{"A": "Tez", "B": "gəldi", "C": "Tez gəldi", "D": "gəlmək", "E": "heç biri"}', 'A', NULL);
INSERT INTO public.questions VALUES (942, 43, '"Səhər tezdən yola düşdük" cümləsində zərflik hansı sözlərdir?', '{"A": "Səhər tezdən", "B": "yola", "C": "düşdük", "D": "yola düşdük", "E": "Səhər düşdük"}', 'A', NULL);
INSERT INTO public.questions VALUES (943, 43, '"Gözəl qız kitab oxuyur" cümləsində təyin hansı sözdür?', '{"A": "Gözəl", "B": "qız", "C": "kitab", "D": "oxuyur", "E": "Gözəl qız"}', 'A', NULL);
INSERT INTO public.questions VALUES (944, 43, '"Kiçik uşaq şirin alma yedi" cümləsində təyinlər hansılardır?', '{"A": "Kiçik, şirin", "B": "uşaq, alma", "C": "yedi", "D": "Kiçik uşaq", "E": "şirin alma"}', 'A', NULL);
INSERT INTO public.questions VALUES (945, 43, '"Müəllim şagirdlərə tapşırıq verdi" cümləsində tamamlıq hansı sözdür?', '{"A": "Müəllim", "B": "şagirdlərə, tapşırıq", "C": "verdi", "D": "Müəllim verdi", "E": "tapşırıq verdi"}', 'B', NULL);
INSERT INTO public.questions VALUES (946, 43, '"Atam Bakıdan gəldi" cümləsində tamamlıq hansı sözdür?', '{"A": "Atam", "B": "Bakıdan", "C": "gəldi", "D": "Atam gəldi", "E": "Bakıdan gəldi"}', 'B', NULL);
INSERT INTO public.questions VALUES (947, 43, '"Qatar sürətlə hərəkət edirdi" cümləsində zərflik hansı sözdür?', '{"A": "Qatar", "B": "sürətlə", "C": "hərəkət", "D": "edirdi", "E": "Qatar hərəkət edirdi"}', 'B', NULL);
INSERT INTO public.questions VALUES (948, 43, '"Balaca uşaq topu aldı" cümləsində cümlə üzvləri hansılardır?', '{"A": "Mübtəda: uşaq, xəbər: aldı, təyin: balaca, tamamlıq: topu", "B": "Mübtəda: balaca, xəbər: aldı, təyin: uşaq, tamamlıq: topu", "C": "Mübtəda: topu, xəbər: aldı, təyin: balaca, tamamlıq: uşaq", "D": "Mübtəda: uşaq, xəbər: topu, təyin: balaca, tamamlıq: aldı", "E": "Mübtəda: uşaq, xəbər: aldı, təyin: topu, tamamlıq: balaca"}', 'A', NULL);
INSERT INTO public.questions VALUES (949, 43, '"Dünən mən kitabxanada maraqlı kitab oxudum" cümləsində zərflik hansı sözdür?', '{"A": "Dünən, kitabxanada", "B": "mən", "C": "maraqlı", "D": "kitab", "E": "oxudum"}', 'A', NULL);
INSERT INTO public.questions VALUES (950, 43, '"Yeni müəllim uşaqlara çətin sual verdi" cümləsində təyin, tamamlıq və zərflik hansılardır?', '{"A": "Təyin: yeni, çətin; tamamlıq: uşaqlara, sual; zərflik: yoxdur", "B": "Təyin: yeni; tamamlıq: uşaqlara; zərflik: çətin", "C": "Təyin: çətin; tamamlıq: sual; zərflik: yeni", "D": "Təyin: yeni, çətin; tamamlıq: uşaqlara; zərflik: yoxdur", "E": "Təyin: yoxdur; tamamlıq: uşaqlara, sual; zərflik: çətin"}', 'A', NULL);
INSERT INTO public.questions VALUES (951, 45, 'Mürəkkəb cümlə nədir?', '{"A": "Bir mübtəda və bir xəbərdən ibarət cümlə", "B": "İki və ya daha çox sadə cümlənin məna və qrammatik cəhətdən birləşməsindən yaranan cümlə", "C": "Yalnız sual cümləsi", "D": "Yalnız nida cümləsi", "E": "Yalnız tək üzvlü cümlə"}', 'B', NULL);
INSERT INTO public.questions VALUES (952, 45, 'Mürəkkəb cümlələr neçə əsas qrupa bölünür?', '{"A": "2 (tabeli və tabesiz)", "B": "3", "C": "4", "D": "5", "E": "6"}', 'A', NULL);
INSERT INTO public.questions VALUES (953, 45, 'Tabesiz mürəkkəb cümlə nədir?', '{"A": "Bir cümlənin digərinə tabe olduğu cümlə", "B": "Bərabər hüquqlu sadə cümlələrin bağlayıcılarla və ya intonasiya ilə birləşdiyi cümlə", "C": "Yalnız bir sadə cümlədən ibarət cümlə", "D": "Yalnız tabeli bağlayıcılarla qurulan cümlə", "E": "Yalnız sual cümləsi"}', 'B', NULL);
INSERT INTO public.questions VALUES (954, 45, 'Tabeli mürəkkəb cümlə nədir?', '{"A": "Bərabər hüquqlu cümlələrin birləşməsi", "B": "Bir cümlənin (baş cümlə) digərinə (budaq cümlə) tabe olduğu cümlə", "C": "Yalnız bir sadə cümlədən ibarət cümlə", "D": "Yalnız tabesiz bağlayıcılarla qurulan cümlə", "E": "Yalnız nida cümləsi"}', 'B', NULL);
INSERT INTO public.questions VALUES (955, 45, '"Günəş çıxdı və hava isindi" cümləsi hansı növ mürəkkəb cümlədir?', '{"A": "Tabeli", "B": "Tabesiz", "C": "Sadə", "D": "Suallı", "E": "Nida"}', 'B', NULL);
INSERT INTO public.questions VALUES (956, 45, '"Mən bilirəm ki, o gələcək" cümləsi hansı növ mürəkkəb cümlədir?', '{"A": "Tabesiz", "B": "Tabeli", "C": "Sadə", "D": "Suallı", "E": "Nida"}', 'B', NULL);
INSERT INTO public.questions VALUES (957, 45, '"Kitab oxudum, sonra yatdım" cümləsi hansı növ mürəkkəb cümlədir?', '{"A": "Tabeli", "B": "Tabesiz", "C": "Sadə", "D": "Suallı", "E": "Nida"}', 'B', NULL);
INSERT INTO public.questions VALUES (958, 45, '"Əgər yağış yağsa, biz evdə qalacağıq" cümləsi hansı növ mürəkkəb cümlədir?', '{"A": "Tabesiz", "B": "Tabeli", "C": "Sadə", "D": "Suallı", "E": "Nida"}', 'B', NULL);
INSERT INTO public.questions VALUES (959, 45, 'Tabesiz mürəkkəb cümlələrdə cümlələr arasında hansı əlaqə olur?', '{"A": "Tabelilik əlaqəsi", "B": "Bərabərlik əlaqəsi", "C": "Yalnız səbəb əlaqəsi", "D": "Yalnız şərt əlaqəsi", "E": "Yalnız nəticə əlaqəsi"}', 'B', NULL);
INSERT INTO public.questions VALUES (960, 45, 'Tabeli mürəkkəb cümlədə hansı cümlə əsas mənanı daşıyır?', '{"A": "Budaq cümlə", "B": "Baş cümlə", "C": "Hər ikisi bərabər", "D": "Heç biri", "E": "Yalnız birinci cümlə"}', 'B', NULL);
INSERT INTO public.questions VALUES (961, 45, '"Mən gəldim, amma o getdi" cümləsində hansı bağlayıcı işlənib?', '{"A": "ki", "B": "amma", "C": "əgər", "D": "çünki", "E": "ona görə"}', 'B', NULL);
INSERT INTO public.questions VALUES (962, 45, '"O dedi ki, sabah gələcək" cümləsində hansı bağlayıcı işlənib?', '{"A": "amma", "B": "ki", "C": "əgər", "D": "çünki", "E": "və"}', 'B', NULL);
INSERT INTO public.questions VALUES (963, 45, '"Hava soyuq olduğu üçün biz evdə qaldıq" cümləsi hansı növ tabeli cümlədir?', '{"A": "Şərt", "B": "Səbəb", "C": "Nəticə", "D": "Zaman", "E": "Məqsəd"}', 'B', NULL);
INSERT INTO public.questions VALUES (964, 45, '"Əgər tez gəlsən, görüşərik" cümləsi hansı növ tabeli cümlədir?', '{"A": "Şərt", "B": "Səbəb", "C": "Nəticə", "D": "Zaman", "E": "Məqsəd"}', 'A', NULL);
INSERT INTO public.questions VALUES (965, 45, '"O, gələndə biz nahar edirdik" cümləsi hansı növ tabeli cümlədir?', '{"A": "Şərt", "B": "Səbəb", "C": "Nəticə", "D": "Zaman", "E": "Məqsəd"}', 'D', NULL);
INSERT INTO public.questions VALUES (966, 45, '"Mən oxumaq üçün kitabxanaya getdim" cümləsi hansı növ tabeli cümlədir?', '{"A": "Şərt", "B": "Səbəb", "C": "Nəticə", "D": "Zaman", "E": "Məqsəd"}', 'E', NULL);
INSERT INTO public.questions VALUES (967, 45, 'Tabesiz mürəkkəb cümlələrdə hansı bağlayıcılardan istifadə olunur?', '{"A": "ki, əgər, çünki", "B": "və, amma, ancaq, lakin, ya, yaxud", "C": "yalnız ki", "D": "yalnız əgər", "E": "yalnız çünki"}', 'B', NULL);
INSERT INTO public.questions VALUES (968, 45, 'Tabeli mürəkkəb cümlələrdə hansı bağlayıcılardan istifadə olunur?', '{"A": "və, amma, ancaq", "B": "ki, əgər, çünki, ona görə ki, hansı ki", "C": "yalnız və", "D": "yalnız amma", "E": "yalnız ya"}', 'B', NULL);
INSERT INTO public.questions VALUES (969, 45, '"Ya sən gəl, ya mən gedim" cümləsi hansı növ mürəkkəb cümlədir?', '{"A": "Tabeli", "B": "Tabesiz", "C": "Sadə", "D": "Suallı", "E": "Nida"}', 'B', NULL);
INSERT INTO public.questions VALUES (970, 45, '"Çünki hava soyuq idi, biz çölə çıxmadıq" cümləsi hansı növ mürəkkəb cümlədir?', '{"A": "Tabesiz", "B": "Tabeli", "C": "Sadə", "D": "Suallı", "E": "Nida"}', 'B', NULL);
INSERT INTO public.questions VALUES (971, 45, '"O qədər yorulmuşdu ki, yerindəcə yuxuya getdi" cümləsində budaq cümlə hansıdır?', '{"A": "O qədər yorulmuşdu", "B": "ki, yerindəcə yuxuya getdi", "C": "yerindəcə", "D": "yuxuya getdi", "E": "O qədər"}', 'B', NULL);
INSERT INTO public.questions VALUES (972, 45, '"Mən bilirəm ki, sən haqlısan" cümləsində baş cümlə hansıdır?', '{"A": "Mən bilirəm", "B": "ki, sən haqlısan", "C": "sən haqlısan", "D": "Mən", "E": "haqlısan"}', 'A', NULL);
INSERT INTO public.questions VALUES (973, 45, 'Tabeli mürəkkəb cümlədə budaq cümlə baş cümləyə necə bağlanır?', '{"A": "Yalnız intonasiya ilə", "B": "Tabeli bağlayıcılar və ya əlaqə sözləri ilə", "C": "Yalnız durğu işarəsi ilə", "D": "Yalnız söz sırası ilə", "E": "Heç bir əlaqə olmur"}', 'B', NULL);
INSERT INTO public.questions VALUES (974, 45, '"Kitabı oxudum və onu rəfdən götürdüm" cümləsi hansı növ mürəkkəb cümlədir?', '{"A": "Tabeli", "B": "Tabesiz", "C": "Sadə", "D": "Suallı", "E": "Nida"}', 'B', NULL);
INSERT INTO public.questions VALUES (975, 45, '"Əgər işini bitirsən, biz parka gedərik" cümləsində budaq cümlə hansıdır?', '{"A": "Əgər işini bitirsən", "B": "biz parka gedərik", "C": "işini bitirsən", "D": "parka gedərik", "E": "Əgər"}', 'A', NULL);
INSERT INTO public.questions VALUES (976, 45, 'Tabesiz mürəkkəb cümlələrdə cümlələr arasında məna əlaqəsi necə ola bilər?', '{"A": "Yalnız səbəb", "B": "Yalnız nəticə", "C": "Birləşmə, qarşılaşdırma, ayrılıq, səbəb-nəticə və s.", "D": "Yalnız şərt", "E": "Yalnız zaman"}', 'C', NULL);
INSERT INTO public.questions VALUES (977, 45, '"Nə o gəldi, nə də mən getdim" cümləsi hansı növ mürəkkəb cümlədir?', '{"A": "Tabeli", "B": "Tabesiz", "C": "Sadə", "D": "Suallı", "E": "Nida"}', 'B', NULL);
INSERT INTO public.questions VALUES (978, 45, '"O, dediyi kimi, hər şey oldu" cümləsində hansı bağlayıcı işlənib?', '{"A": "ki", "B": "kimi", "C": "əgər", "D": "çünki", "E": "amma"}', 'B', NULL);
INSERT INTO public.questions VALUES (979, 45, 'Tabeli mürəkkəb cümlədə budaq cümlə hansı suallara cavab verə bilər?', '{"A": "Yalnız “nə?” sualına", "B": "Yalnız “kim?” sualına", "C": "Müxtəlif suallara (nə? necə? nə vaxt? niyə? harada? və s.)", "D": "Yalnız “harada?” sualına", "E": "Yalnız “niyə?” sualına"}', 'C', NULL);
INSERT INTO public.questions VALUES (980, 45, '"Mən istəyirəm ki, sən gələsən" cümləsində budaq cümlə hansıdır?', '{"A": "Mən istəyirəm", "B": "ki, sən gələsən", "C": "sən gələsən", "D": "Mən", "E": "istəyirəm"}', 'B', NULL);


--
-- TOC entry 5040 (class 0 OID 16630)
-- Dependencies: 222
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.sections VALUES (1, 1, 'Ədədlər və hesablama');
INSERT INTO public.sections VALUES (2, 1, 'Cəbr');
INSERT INTO public.sections VALUES (3, 1, 'Həndəsə');
INSERT INTO public.sections VALUES (4, 1, 'Statistika və ehtimal');
INSERT INTO public.sections VALUES (5, 2, 'Fonetika və orfoqrafiya');
INSERT INTO public.sections VALUES (6, 2, 'Leksika');
INSERT INTO public.sections VALUES (7, 2, 'Morfologiya');
INSERT INTO public.sections VALUES (8, 2, 'Sintaksis');
INSERT INTO public.sections VALUES (9, 3, 'Grammar');
INSERT INTO public.sections VALUES (10, 3, 'Vocabulary');
INSERT INTO public.sections VALUES (11, 3, 'Reading');


--
-- TOC entry 5038 (class 0 OID 16619)
-- Dependencies: 220
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.subjects VALUES (1, 'Riyaziyyat');
INSERT INTO public.subjects VALUES (2, 'Azərbaycan dili');
INSERT INTO public.subjects VALUES (3, 'İngilis dili');


--
-- TOC entry 5042 (class 0 OID 16644)
-- Dependencies: 224
-- Data for Name: topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.topics VALUES (1, 1, 'Həqiqi ədədlər', 9);
INSERT INTO public.topics VALUES (2, 1, 'Həqiqi ədədlər', 11);
INSERT INTO public.topics VALUES (3, 1, 'Kəsrlər', 9);
INSERT INTO public.topics VALUES (4, 1, 'Kəsrlər', 11);
INSERT INTO public.topics VALUES (5, 1, 'Dərəcə və qüvvət', 9);
INSERT INTO public.topics VALUES (6, 1, 'Dərəcə və qüvvət', 11);
INSERT INTO public.topics VALUES (7, 1, 'Mütləq qiymət (modul)', 9);
INSERT INTO public.topics VALUES (8, 1, 'Mütləq qiymət (modul)', 11);
INSERT INTO public.topics VALUES (9, 1, 'Faizlər', 9);
INSERT INTO public.topics VALUES (10, 1, 'Faizlər', 11);
INSERT INTO public.topics VALUES (11, 2, 'Tənliklər', 9);
INSERT INTO public.topics VALUES (12, 2, 'Tənliklər', 11);
INSERT INTO public.topics VALUES (13, 2, 'Tənliklər sistemi', 9);
INSERT INTO public.topics VALUES (14, 2, 'Tənliklər sistemi', 11);
INSERT INTO public.topics VALUES (15, 2, 'Kvadrat tənliklər', 9);
INSERT INTO public.topics VALUES (16, 2, 'Kvadrat tənliklər', 11);
INSERT INTO public.topics VALUES (17, 2, 'Proqresiyalar və funksiyalar', 9);
INSERT INTO public.topics VALUES (18, 2, 'Proqresiyalar və funksiyalar', 11);
INSERT INTO public.topics VALUES (19, 3, 'Üçbucaqlar və bucaqlar', 9);
INSERT INTO public.topics VALUES (20, 3, 'Üçbucaqlar və bucaqlar', 11);
INSERT INTO public.topics VALUES (21, 3, 'Çoxbucaqlılar', 9);
INSERT INTO public.topics VALUES (22, 3, 'Çoxbucaqlılar', 11);
INSERT INTO public.topics VALUES (23, 3, 'Çevrə və dairə', 9);
INSERT INTO public.topics VALUES (24, 3, 'Çevrə və dairə', 11);
INSERT INTO public.topics VALUES (25, 3, 'Triqonometriya', 9);
INSERT INTO public.topics VALUES (26, 3, 'Triqonometriya', 11);
INSERT INTO public.topics VALUES (27, 4, 'Orta qiymət və moda', 9);
INSERT INTO public.topics VALUES (28, 4, 'Orta qiymət və moda', 11);
INSERT INTO public.topics VALUES (29, 4, 'Ehtimal nəzəriyyəsi', 9);
INSERT INTO public.topics VALUES (30, 4, 'Ehtimal nəzəriyyəsi', 11);
INSERT INTO public.topics VALUES (31, 5, 'Səs və hərf', 9);
INSERT INTO public.topics VALUES (32, 5, 'Səs və hərf', 11);
INSERT INTO public.topics VALUES (33, 5, 'Orfoqrafiya qaydaları', 9);
INSERT INTO public.topics VALUES (34, 5, 'Orfoqrafiya qaydaları', 11);
INSERT INTO public.topics VALUES (35, 6, 'Sinonim və antonym', 9);
INSERT INTO public.topics VALUES (36, 6, 'Sinonim və antonym', 11);
INSERT INTO public.topics VALUES (37, 6, 'Frazeoloji birləşmələr', 9);
INSERT INTO public.topics VALUES (38, 6, 'Frazeoloji birləşmələr', 11);
INSERT INTO public.topics VALUES (39, 7, 'İsim və sifət', 9);
INSERT INTO public.topics VALUES (40, 7, 'İsim və sifət', 11);
INSERT INTO public.topics VALUES (41, 7, 'Feil və təsriflənməyən formalar', 9);
INSERT INTO public.topics VALUES (42, 7, 'Feil və təsriflənməyən formalar', 11);
INSERT INTO public.topics VALUES (43, 8, 'Cümlənin üzvləri', 9);
INSERT INTO public.topics VALUES (44, 8, 'Cümlənin üzvləri', 11);
INSERT INTO public.topics VALUES (45, 8, 'Mürəkkəb cümlələr', 9);
INSERT INTO public.topics VALUES (46, 8, 'Mürəkkəb cümlələr', 11);
INSERT INTO public.topics VALUES (47, 9, 'Tenses', 9);
INSERT INTO public.topics VALUES (48, 9, 'Tenses', 11);
INSERT INTO public.topics VALUES (49, 9, 'Conditionals', 9);
INSERT INTO public.topics VALUES (50, 9, 'Conditionals', 11);
INSERT INTO public.topics VALUES (51, 9, 'Passive voice', 9);
INSERT INTO public.topics VALUES (52, 9, 'Passive voice', 11);
INSERT INTO public.topics VALUES (53, 10, 'Word formatting', 9);
INSERT INTO public.topics VALUES (54, 10, 'Word formatting', 11);
INSERT INTO public.topics VALUES (55, 10, 'Phrasal verbs', 9);
INSERT INTO public.topics VALUES (56, 10, 'Phrasal verbs', 11);
INSERT INTO public.topics VALUES (57, 11, 'Main idea', 9);
INSERT INTO public.topics VALUES (58, 11, 'Main idea', 11);
INSERT INTO public.topics VALUES (59, 11, 'Inference', 9);
INSERT INTO public.topics VALUES (60, 11, 'Inference', 11);


--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 225
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.questions_id_seq', 980, true);


--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 221
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sections_id_seq', 11, true);


--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 219
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subjects_id_seq', 3, true);


--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 223
-- Name: topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.topics_id_seq', 60, true);


--
-- TOC entry 4886 (class 2606 OID 16672)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- TOC entry 4882 (class 2606 OID 16637)
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 16628)
-- Name: subjects subjects_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_name_key UNIQUE (name);


--
-- TOC entry 4880 (class 2606 OID 16626)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- TOC entry 4884 (class 2606 OID 16653)
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 16673)
-- Name: questions questions_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;


--
-- TOC entry 4887 (class 2606 OID 16638)
-- Name: sections sections_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- TOC entry 4888 (class 2606 OID 16654)
-- Name: topics topics_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


-- Completed on 2026-11-15 04:26:30

--
-- PostgreSQL database dump complete
--

\unrestrict l1YMYKEhEEkOrrdznE3ziYYqn34dXM8ekJeUXIfNFAXgrkgYQqjHzZtU6fEBb5u

