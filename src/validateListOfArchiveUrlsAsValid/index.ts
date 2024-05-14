import { checkUrlValidity } from "../utils/utils";


const urlData = `
(1). Adhunik Bharatiya Arya Bhashao Ka Punarvargikaran By Ghanshyam Vyas 1981 - Gurukul Kangri Collection
        https://archive.org/details/ADdn_adhunik-bharatiya-arya-bhashao-ka-punarvargikaran-by-ghanshyam-vyas-1981-gurukul-kangri-collect
        
(2). Ahle Hindi Ki Jismani Kamzori Or Thfuz Ki Taabir G.K.V Urdu - Gurukul Kangri Collection
        https://archive.org/details/qLPc_ahle-hindi-ki-jismani-kamzori-or-thfuz-ki-taabir-g.-k.-v-urdu-gurukul-kangri-collection
        
(3). Akash Darshan By Gunakar Mule - Gurukul Kangri Collection
        https://archive.org/details/HfqU_akash-darshan-by-gunakar-mule-gurukul-kangri-collection
        
(4). Anand Panth By James Allen Translated By Shri Hamsaraj Vohara - Globe Publications
        https://archive.org/details/Mynw_anand-panth-by-james-allen-translated-by-shri-hamsaraj-vohara-globe-publications
        
(5). Arogya Darsha Book 1 1906 - E.J.Lazarus & Co. Benares
        https://archive.org/details/AhmF_arogya-darsha-book-1-1906-e.-j.-lazarus-co.-benares
        
(6). Artha Vigjyan Aur vyakaran Darshan By Kapil Dev Dwivedi Acharya 1951 - Hindusthan Academy
        https://archive.org/details/iEeD_artha-vigjyan-aur-vyakaran-darshan-by-kapil-dev-dwivedi-acharya-1951-hindusthan-academy
        
(7). Arya Mantavya Prakash Part 2 By Shriyut Pandit Aryamuni 1906 - Gurukul Kangri Collection
        https://archive.org/details/bZIJ_arya-mantavya-prakash-part-2-by-shriyut-pandit-aryamuni-1906-gurukul-kangri-collection
        
(8). Arya Musafir Magazine 1909 Vol. 12 Urdu - Gurukul Kangri Collection
        https://archive.org/details/EPgw_arya-musafir-magazine-1909-vol.-12-urdu-gurukul-kangri-collection
        
(9). Arya Musafir Magazine Urdu - Gurukul Kangri Collection
        https://archive.org/details/gSCo_arya-musafir-magazine-urdu-gurukul-kangri-collection
        
(10). Atma Katha By Mathura Prasad Vanaprasthi 1955 - Gurukul Kandri Collection
        https://archive.org/details/HNVF_atma-katha-by-mathura-prasad-vanaprasthi-1955-gurukul-kandri-collection
        
(11). Ayurved Ki Itihas Part 1 By Suramchandr 1952 - Kaviraj Suramachandr
        https://archive.org/details/Rfqo_ayurved-ki-itihas-part-1-by-suramchandr-1952-kaviraj-suramachandr
        
(12). Bhargava Champu By Rama Krishan Suri 1891  - Gurukul Kangri CollectionBhargava Champu By Rama Krishan Suri 1891  - Gurukul Kangri Collection
        https://archive.org/details/jXpm_bhargava-champu-by-rama-krishan-suri-1891-gurukul-kangri-collection-bhargava-cha
        
(13). Bhartru Hari Nirvedam Kavyamala 29 By Hariharopadyaya 1900 - Tukaram Javaji
        https://archive.org/details/pSjm_bhartru-hari-nirvedam-kavyamala-29-by-hariharopadyaya-1900-tukaram-javaji
        
(14). Bhasha tatva Aur Vakyapadiy By Styakam varma  1964 Chowkamba Vidyabhavan - Bharatiya Prakashan
        https://archive.org/details/GyGk_bhasha-tatva-aur-vakyapadiy-by-styakam-varma-1964-chowkamba-vidyabhavan-bharatiya-prakashan
        
(15). Chikitsa Alok By Shri Krishnadev Ji Chaitanya Parashar 1979 - Shri Chaitanya Samsthan Yoga Ashram
        https://archive.org/details/QFny_chikitsa-alok-by-shri-krishnadev-ji-chaitanya-parashar-1979-shri-chaitanya-samsthan-yoga-ashram
        
(16). Congress Ki Muslim Poshak Neeti Tatha Hindu Part 1 And 2 By Ramanarayan 2009 - Satya Dharm Prakashan
        https://archive.org/details/EyXw_congress-ki-muslim-poshak-neeti-tatha-hindu-part-1-and-2-by-ramanarayan-2009-satya-dharm-prakas
        
(17). Desh Bandhu Lekhavali Adyatmik Nibandha Ed. By Aditya Prakash Arya 1996 - Gurukul Kangri Collection
        https://archive.org/details/CmLJ_desh-bandhu-lekhavali-adyatmik-nibandha-ed.-by-aditya-prakash-arya-1996-gurukul-kangri-collecti
        
(18). Dharma Raksha Urdu - Gurukul Kangri Collection
        https://archive.org/details/zNRM_dharma-raksha-urdu-gurukul-kangri-collection
        
(19). Dharma Raksha Urdu Shraddha Ram Filauri 1897 - Gurukul Kangri Collection
        https://archive.org/details/VOCz_dharma-raksha-urdu-shraddha-ram-filauri-1897-gurukul-kangri-collection
        
(20). Doulat Daren Yaani Ashtang Yog Prakash 1904 Urdu - Gurukul Kangri Collection
        https://archive.org/details/ZTRY_doulat-daren-yaani-ashtang-yog-prakash-1904-urdu-gurukul-kangri-collection
        
(21). Doulat Daren Yaani Yog Prakash Urdu - Gurukul Kangri Collection
        https://archive.org/details/iBsz_doulat-daren-yaani-yog-prakash-urdu-gurukul-kangri-collection
        
(22). Dr. Nirupan Vidyalankar Abhinandan Granth Ed. by Uma Kanth Shukla 1984 - Merath Viswa Vidyalai Sanskrit Adyapak Parishad
        https://archive.org/details/pNic_dr.-nirupan-vidyalankar-abhinandan-granth-ed.-by-uma-kanth-shukla-1984-merath-vi
        
(23). Dravya Guna Vijgyanam By Yadava Sharma Part 2 1950 - Nirnaya Sagar Press
        https://archive.org/details/EpLN_dravya-guna-vijgyanam-by-yadava-sharma-part-2-1950-nirnaya-sagar-press
        
(24). Gruhini By Girija Kumar Ghosh 1910 - Gurukul Kangri Collection
        https://archive.org/details/AKya_gruhini-by-girija-kumar-ghosh-1910-gurukul-kangri-collection
        
(25). Gurukula Vidyalaya Kangri Monthly Magazine - Gurukul Kangri Collection
        https://archive.org/details/Bqvu_gurukula-vidyalaya-kangri-monthly-magazine-gurukul-kangri-collection
        
(26). Hadaikusahat Dr.Mohmmad Afzal Sahab Urdu - Gurukul Kangri Collection
        https://archive.org/details/zFBd_hadaikusahat-dr.-mohmmad-afzal-sahab-urdu-gurukul-kangri-collection
        
(27). Hindi Aur Devanagari By Shri Narayan Chaturvedi 2000 - Gurukul Kangri Collection
        https://archive.org/details/BFxn_hindi-aur-devanagari-by-shri-narayan-chaturvedi-2000-gurukul-kangri-collection
        
(28). Hinduon Ke Dharmashastra Evam Ritirivajon Ka Sanghraha Urdu Book 1899 - Gurukul Kangri Collection
        https://archive.org/details/Fhof_hinduon-ke-dharmashastra-evam-ritirivajon-ka-sanghraha-urdu-book-1899-gurukul-kangri-collection
        
(29). Inder Patrika Urdu - Gurukul Kangri Collection
        https://archive.org/details/IiDf_inder-patrika-urdu-gurukul-kangri-collection
        
(30). Ishavasya Upanishad Shri purna Devi Grantha Mala Prathama Pushp  - Gurukul Kangri Collection
        https://archive.org/details/NeEj_ishavasya-upanishad-shri-purna-devi-grantha-mala-prathama-pushp-gurukul-kangri-collection
        
(31). Jeevan Rahasya Adhyatmik Jyan Kosh Part 2 By Surendra Kumar Dhanda 2010 Delhi - Shri Nataraj Prakashan
        https://archive.org/details/kBWq_jeevan-rahasya-adhyatmik-jyan-kosh-part-2-by-surendra-kumar-dhanda-2010-delhi-shri-nataraj-prak
        
(32). Kalyat Ala Ke Dhari Urdu - Gurukul Kangri Collection
        https://archive.org/details/kUmv_kalyat-ala-ke-dhari-urdu-gurukul-kangri-collection
        
(33). Kalyug Ka Avtaar Urdu - Gurukul Kangri Collection
        https://archive.org/details/LAYT_kalyug-ka-avtaar-urdu-gurukul-kangri-collection
        
(34). Kavya Mala Part 10 Ed. By Pandit Shiva Datta 1903 - Gurukul Kangri Collection
        https://archive.org/details/teaS_kavya-mala-part-10-ed.-by-pandit-shiva-datta-1903-gurukul-kangri-collection
        
(35). Kisan Ki Beti Part 1 By Babu Ganga Prasad Gupt 1908 Kashi - Gurukul Kangri Collection
        https://archive.org/details/kOhy_kisan-ki-beti-part-1-by-babu-ganga-prasad-gupt-1908-kashi-gurukul-kangri-collection
        
(36). Koutilya Artha Sastra Ka Sarala Aur Saragarbhit Hindi Bhasha Anuvada Missing Pages - Mothilal Banarasi Das
        https://archive.org/details/soTX_koutilya-artha-sastra-ka-sarala-aur-saragarbhit-hindi-bhasha-anuvada-missing-pag
        
(37). Lelin Urdu - Gurukul Kangri Collection
        https://archive.org/details/DKKC_lelin-urdu-gurukul-kangri-collection
        
(38). Luknow Ki Navabi Part 1 Thakur Prasad Khatri 1906 - Gurukul Kangri Collection
        https://archive.org/details/IPzZ_luknow-ki-navabi-part-1-thakur-prasad-khatri-1906-gurukul-kangri-collection
        
(39). Maharishi Dayanand Aur Rajaram Mohanroy Ke Tulunatmaka Vichar By Bhavani Lal Missing Pages - Arya Prakash Pustakalai
        https://archive.org/details/vWsj_maharishi-dayanand-aur-rajaram-mohanroy-ke-tulunatmaka-vichar-by-bhavani-lal-mis
        
(40). Mahatmya Chanakya By Bhumakethu 2003 - Satyadharma Prakashan
        https://archive.org/details/ENpm_mahatmya-chanakya-by-bhumakethu-2003-satyadharma-prakashan
        
(41). Marishas Ke Nirmata Sar Shivasagar Ramagulam By Uday Narayanan Gangu - Bharatiya Samskrit Sahitya Kala Samstha
        https://archive.org/details/PYgF_marishas-ke-nirmata-sar-shivasagar-ramagulam-by-uday-narayanan-gangu-bharatiya-s
        
(42). Mere Jivan Ki Anubhav Katha By Shri Nana Ji Bhai Kalidas Mehata 1958 - Gurukul Kangri Collection
        https://archive.org/details/knAJ_mere-jivan-ki-anubhav-katha-by-shri-nana-ji-bhai-kalidas-mehata-1958-gurukul-kangri-collection
        
(43). Mere Samsmaran Atma Katha Ke Swaroop Me By Mulraj 1954 Delhi - Panjab Pusthak Bandhar
        https://archive.org/details/TlJW_mere-samsmaran-atma-katha-ke-swaroop-me-by-mulraj-1954-delhi-panjab-pusthak-bandhar
        
(44). Parama Pujaniya Bhagavan Devatma By Yashpal Singh Bhalla - Gurukul Kangri Collection
        https://archive.org/details/zWca_parama-pujaniya-bhagavan-devatma-by-yashpal-singh-bhalla-gurukul-kangri-collection
        
(45). Pateet Uddhar Urdu - Gurukul Kangri Collection
        https://archive.org/details/ZrRu_pateet-uddhar-urdu-gurukul-kangri-collection
        
(46). Pingala Chanda Sutram 1931 Calcutta - Janakinatha Kabyatirtha & Brothers Chhatra Pustakalaya
        https://archive.org/details/jydz_pingala-chanda-sutram-1931-calcutta-janakinatha-kabyatirtha-brothers-chhatra-pustakalaya
        
(47). Prakash Punj By Acharya Vidya Ratn Jwalapur - Arya Vanaprasthana Asharam
        https://archive.org/details/ytOM_prakash-punj-by-acharya-vidya-ratn-jwalapur-arya-vanaprasthana-asharam
        
(48). Purananam Kavyarupataya Vivechannam By Ram Pratap Vedalankar 1974 - Jammu University
        https://archive.org/details/UWJS_purananam-kavyarupataya-vivechannam-by-ram-pratap-vedalankar-1974-jammu-university
        
(49). Rajanitik Vicharo Ka Itihas Part 2 By Jyoti Prakash 1959 - Jayaprakash Nath And Company
        https://archive.org/details/MYNn_rajanitik-vicharo-ka-itihas-part-2-by-jyoti-prakash-1959-jayaprakash-nath-and-company
        
(50). Ramayan By Goswami Tulasi Das - Gurukul Kangri Collection
        https://archive.org/details/gVzu_ramayan-by-goswami-tulasi-das-gurukul-kangri-collection
        
(51). Rameswaram Mahakavya By Dev Narayan Trivedi - Manas Sangham
        https://archive.org/details/THXD_rameswaram-mahakavya-by-dev-narayan-trivedi-manas-sangham
        
(52). Rathna Prabodha Ratnasharam - Gurukul Kangri Collection
        https://archive.org/details/nXkn_rathna-prabodha-ratnasharam-gurukul-kangri-collection
        
(53). Sabha Ardh Shatabdi Vivaran  1995 - Gurukul Kangri Collection
        https://archive.org/details/RXgB_sabha-ardh-shatabdi-vivaran-1995-gurukul-kangri-collection
        
(54). Sache Guru Aur Irihasik Pralekhan By Vedant Vedavagish 1966 - Swarn Jayanthi Prakashan
        https://archive.org/details/xjTa_sache-guru-aur-irihasik-pralekhan-by-vedant-vedavagish-1966-swarn-jayanthi-prakashan
        
(55). Sahaj Katha By Santh Nikka Singh Ji Maharaj  2003 Rishikesh - Nirmal Asharam
        https://archive.org/details/wWip_sahaj-katha-by-santh-nikka-singh-ji-maharaj-2003-rishikesh-nirmal-asharam
        
(56). Sahitya Chinta By Devaraj Delhi 1950 - Goutham Buddha Depot
        https://archive.org/details/XNKH_sahitya-chinta-by-devaraj-delhi-1950-goutham-buddha-depot
        
(57). Samaloshana Darsh Commet. By Jagannath Das 1896 - The Chandra Prabha Press Co. Ltd
        https://archive.org/details/wTpJ_samaloshana-darsh-commet.-by-jagannath-das-1896-the-chandra-prabha-press-co.-ltd
        
(58). Samarpan Missing Pages - Gurukul Kangri Collection
        https://archive.org/details/Jiqa_samarpan-missing-pages-gurukul-kangri-collection
        
(59). Samskrutika Vichar By Lakshmi Narayanan Chathurvedi 1980 - Gurukul Kangri Collection
        https://archive.org/details/eLJp_samskrutika-vichar-by-lakshmi-narayanan-chathurvedi-1980-gurukul-kangri-collection
        
(60). Sarirakriya Vijnana By P.V.Sharma The V. Ayurveda Series 2 1986 Varanasi - Chaukhambha Bharati Academy
        https://archive.org/details/Vicb_sarirakriya-vijnana-by-p.-v.-sharma-the-v.-ayurveda-series-2-1986-varanasi-chauk
        
(61). Schaeffer Experimental Physiology Urdu Book - Gurukul Kangri Collection
        https://archive.org/details/ULOF_schaeffer-experimental-physiology-urdu-book-gurukul-kangri-collection
        
(62). Shankar Dig Vijaya 1888 Lucknow - Gurukul Kangri Collection
        https://archive.org/details/taFP_shankar-dig-vijaya-1888-lucknow-gurukul-kangri-collection
        
(63). Sharngadhara Saitya Mein Sharira Vigyana (111228)
        https://archive.org/details/avip_sharngadhara-saitya-mein-sharira-vigyana-111228
        
(64). Skanda Purana Second Half Gurumandal Series 20 Vol. 5 By Maharshi Vedavyas 1962 - Gurukul Kangri Collection
        https://archive.org/details/XmtA_skanda-purana-second-half-gurumandal-series-20-vol.-5-by-maharshi-vedavyas-1962-
        
(65). Skanda Purana Uttara Ardham Gurumandal Series 20 Vol. 5 By Maharshi Vedavyas 1962 - Gurukul Kangri Collection
        https://archive.org/details/Efmf_skanda-purana-uttara-ardham-gurumandal-series-20-vol.-5-by-maharshi-vedavyas-196
        
(66). Tahzeeb Ul Islaam Urdu - Gurukul Kangri Collection
        https://archive.org/details/iPAp_tahzeeb-ul-islaam-urdu-gurukul-kangri-collection
        
(67). Vanita By Veda Vrath Sharma 1991 - Lakshmi Prakashan Samstha
        https://archive.org/details/bEGq_vanita-by-veda-vrath-sharma-1991-lakshmi-prakashan-samstha
        
(68). Vaydyak Sabdasindhu By Kaviraj Nagendra Nath Sen 1914 - Gurukul Kangri Collection
        https://archive.org/details/PDqC_vaydyak-sabdasindhu-by-kaviraj-nagendra-nath-sen-1914-gurukul-kangri-collection
        
(69). Veda Jyoti 7-10 1984 - Gurukul Kangri Collection
        https://archive.org/details/SHPU_veda-jyoti-7-10-1984-gurukul-kangri-collection
        
(70). Veda Jyoti Atharva Veda Vol.15 1991 - Gurukul Kangri Collection
        https://archive.org/details/IJeZ_veda-jyoti-atharva-veda-vol.-15-1991-gurukul-kangri-collection
        
(71). Veda Jyoti Atharva Veda Vol.17 1993 - Gurukul Kangri Collection
        https://archive.org/details/IjzX_veda-jyoti-atharva-veda-vol.-17-1993-gurukul-kangri-collection
        
(72). Veda Savita 1984 - Gurukul Kangri Collection
        https://archive.org/details/PjZv_veda-savita-1984-gurukul-kangri-collection
        
(73). Veda Vidya Trimasika Shodha Patrika Edited By Om Prakash Pandey 2003 - Maharishi Sandipini Rashtriya Veda Vidya Pratisthan
        https://archive.org/details/ivin_veda-vidya-trimasika-shodha-patrika-edited-by-om-prakash-pandey-2003-maharishi-s
        
(74). Veda jyoti - Gurukul Kangri Collection
        https://archive.org/details/LboX_veda-jyoti-gurukul-kangri-collection
        
(75). Vedarth Karne Ki Vidhi By Chandramani Vidyalankar 1982 - Gurukul Kangri Collection
        https://archive.org/details/LXBe_vedarth-karne-ki-vidhi-by-chandramani-vidyalankar-1982-gurukul-kangri-collection
        
(76). Vedic Jyotih Vol 1 Research Journal Ed. Dinesh Chandra Shastri 2001 Haridwar  - Gurukul Kangri Vishwavidyalaya
        https://archive.org/details/JCWy_vedic-jyotih-vol-1-research-journal-ed.-dinesh-chandra-shastri-2001-haridwar-gur
        
(77). Vedic Light Vol 25 Ed. By S.C.Pathak Journal 1987 English - Gurukul Kangri Collection
        https://archive.org/details/hHiK_vedic-light-vol-25-ed.-by-s.-c.-pathak-journal-1987-english-gurukul-kangri-collection
        
(78). Vedic Light Vol. 26 Ed. By S.C.Pathak  Journal 1988 New Delhi - Sarvadeshik Arya Pratinidhi Sabha
        https://archive.org/details/uqwI_vedic-light-vol.-26-ed.-by-s.-c.-pathak-journal-1988-new-delhi-sarvadeshik-arya-pratinidhi-sabh
        
(79). Vedic Light Vol. 27 Ed. By S.C.Pathak  Journal 1989 New Delhi - Sarvadeshik Arya Pratinidhi Sabha
        https://archive.org/details/ZYNO_vedic-light-vol.-27-ed.-by-s.-c.-pathak-journal-1989-new-delhi-sarvadeshik-arya-pratinidhi-sabh
        
(80). Yunani Chikitsa Sara By Hakim Dalajit Singh 1953 - Shri Vaidyanath Ayurved Bhvan Limited
        https://archive.org/details/cYyz_yunani-chikitsa-sara-by-hakim-dalajit-singh-1953-shri-vaidyanath-ayurved-bhvan-limited
        
(81). gruhastha Dharma Edited By Avadhvihari Lal - Gurukul Kangri Collection
        https://archive.org/details/tjqg_gruhastha-dharma-edited-by-avadhvihari-lal-gurukul-kangri-collection
        
`;

(async () => {
    const lines = urlData.split('\n');
    for (const line of lines) {
       // console.log(`Opening ${line}: `);

        if (line?.trim().startsWith('http')) {
            const result = await checkUrlValidity(line,0,0);
            console.log(`Opening ${line}: ${result}`);
        }
    }
})()
