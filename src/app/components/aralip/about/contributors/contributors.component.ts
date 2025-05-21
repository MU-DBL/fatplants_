import { Component } from '@angular/core';

@Component({
  selector: 'app-contributors',
  templateUrl: './contributors.component.html',
  styleUrls: ['./contributors.component.css']
})
export class ContributorsComponent {
  contributors = [
    {
      name: 'Sébastien Baud',
      image: '/app/assets/aralip_contributors/Sebasitien-Baud.jpg', 
      email: 'sbaud@versailles.inra.fr',
      summary: 'Biotechnology scientist with broad experience in seed metabolic networks, transcriptional regulation of gene expression, and genetic engineering of Arabidopsis.'
    },
    {
      name: 'Mats Anderson',
      image: '/app/assets/aralip_contributors/Mats-Andersson.jpg',
      summary: 'Junior professor at the University of Gothenburg, Sweden, Plant biochemist with one foot in plant-pathogen interactions and the other in associations between the ER and the chloroplast envelope.'
    },
    {
      name: 'Amelie Kelly',
      image: '/app/assets/aralip_contributors/Amelie-Kelly.jpg', 
      profile: 'http://www2.warwick.ac.uk/fac/sci/whri/research/plantmetabolism/',
      network: 'http://www.linkedin.com/in/ameliekelly',
      network_name:'LinkedIn',
      summary: 'Plant Biochemist with interest in the (regulative) role of protein-lipid interactions during membrane biogenesis and oil breakdown.'
    },
    {
      name: 'Philip Bates',
      image: '/app/assets/aralip_contributors/Phil-Bates.jpg', 
      profile: 'http://scholar.google.com/citations?user=2teh5A8AAAAJ',
      network: 'http://www.linkedin.com/pub/philip-bates/17/988/881',
      email: 'phil_bates@wsu.edu',
      summary: 'Postdoctoral Research Associate of the Institute of Biological Chemistry at Washington State University, WA, USA. I have extensive experience in plant lipid biochemistry pertaining to the synthesis of phospholipids and triacylglycerols. My research involves determining the relative flux of fatty acids and glycerolipid precursors through multiple pathways of glycerolipid synthesis. Additionally, I investigate the pathways and enzymes that are required to accumulate novel fatty acids in transgenic plants for food, fuel and industrial uses.'
    },
    {
      name: 'Ikuo Nishida',
      image: '/app/assets/aralip_contributors/Ikuo-Nishida.jpg', 
      email: 'nishida@molbiol.saitama-u.ac.jp',
      summary: 'Professor, Department of Biochemistry and Molecular Biology, Graduate School of Science and Engineering, Saitama University, Japan. Plant Biologist with broad experience in lipid biochemistry and physiology. Love butterflies and aquatic small animals.'
    },
    {
      name: 'Jonathan Markham',
      image: '/app/assets/aralip_contributors/Jonathan-Markham.jpg', 
      email: 'jmarkham@danforthcenter.org',
      summary: 'Research Scientist at the Donald Danforth Plant Science Center, Missouri, USA. Experienced in biology and analysis of sphingolipids from plants, algae, and fungi.'
    },
    {
      name: 'Kenta Katayama',
      image: '/app/assets/aralip_contributors/Kenta-Katayama.jpg', 
      email: 'kenta@bio.c.u-tokyo.ac.jp',
      summary: 'Graduate Student at Department of Biological Sciences, Graduate School of Science, the University of Tokyo, Japan. Interested in genes involved in membrane lipids and the central roles of lipids in membrane dynamics.'
    },
    {
      name: 'Hajime Wada',
      image: '/app/assets/aralip_contributors/Hajime-Wada.jpg', 

      email: 'hwada@bio.c.u-tokyo.ac.jp',
      summary: 'Professor at Department of Life Sciences, Graduate School of Arts and Sciences, The University of Tokyo, Japan. My research interest is to understand genes and enzymes that are involved in lipid metabolism in photosynthetic organisms such as higher plants and cyanobacteria, and also to understand roles of lipids in membrane biogenesis, bioenergetics, vesicular trafficking and environmental adaptation.'
    },
    {
      name: 'Tim Durrett',
      image: '/app/assets/aralip_contributors/Tim-Durrett.jpg', 

      network: 'http://www.linkedin.com/in/timothydurrett',
      email: 'tdurrett@msu.edu',
      summary: 'Postdoctoral Fellow at Michigan State University. Extensive experience with lipid biochemistry, molecular biology, and plant genomics.'
    },
    {
      name: 'Xu Changcheng',
      image: '/app/assets/aralip_contributors/Xu-Changcheng.jpg',
      email: 'cxu@bnl.gov',
      summary: 'Research scientist at Brookhaven National Laboratory, Upton, NY. Our research group seeks to dissect the regulatory network governing lipid biosynthesis and storage by a combination of molecular genetic, cell biological and biochemical approaches. We use the seed plant Arabidopsis and the unicellular microalgae Chlamydomonas as complementary experimental model systems. Specific areas of interest include the regulation of triacylglycerol assembly and deposition and the molecular basis for interorganelle lipid transfer.'
    },
    {
      name: 'David Bird',
      image: '/app/assets/aralip_contributors/David-Bird.jpg', 
      network: 'http://www.biomedexperts.com/Profile.bme/1775754/David_Bird',
      network_name: 'BiomedExpert',
      email: 'dbird@mtroyal.ca',
      summary: 'My area of interest is plant cell and molecular biology. In particular, I am interested in how plants synthesize and secrete the surface lipids that make of the protective cuticle of the plant. The plant cuticle is essential for limiting water loss, and defence from insect and microbial attack. Current Areas of Research: -Identification and characterization of ABC transporters and other components involved in the export of cuticular lipids -Ultra-structural characterization of the cuticle-cell wall interface.'
    },
    {
      name: 'Owen Rowland',
      image: '/app/assets/aralip_contributors/Owen-Rowland.jpg', 
      profile: 'http://rowlandlab.blogspot.ca',
      network: 'http://www.linkedin.com/pub/owen-rowland/18/814/4a0',
      email: 'owen_rowland@carleton.ca',
      summary: 'Associate Professor in the Department of Biology and Institute of Biochemistry at Carleton University, Ottawa, Canada. Expertise in plant molecular biology, genomics, gene expression, genetic engineering, and microbiology. The major research themes of the Rowland lab are plant lipid metabolism, plant-environment interactions, and metabolic engineering of plants and microbes.'
    },
    {
      name: 'Fred Beisson',
      image: '/app/assets/aralip_contributors/Fred-Beisson.jpg', 
      email: 'frederic.beisson@cea.fr',
      summary: 'Research scientist at the Department of Plant Biology and Environmental Microbiology, CEA-CNRS-Aix Marseille University, France. Focused on the discovery of proteins involved in the biosynthesis of extracellular lipids in plants.'
    },
    {
      name: 'Yonghua Li-Beisson',
      image: '/app/assets/aralip_contributors/Yonghua-Li.jpg',
      network_name:'www-dsv.cea.fr/lb3m',
      email: 'yonghua.li@cea.fr',
      summary: 'Research scientist at CEA (the French Atomic and Alternative Energy Commission), Center de Cadarache, France. My broad research interest is to understand genes and pathways that underline lipid metabolism in plants and microorganisms, and the further use of this knowledge to metabolic engineer organisms (plants, fungi and microalgae) for increasing oil deposition or for production of industrially important fatty acids via biotechnological means.'
    },
    {
      name: 'Rochus Franke',
      image: '/app/assets/aralip_contributors/Rochus-Franke.jpg', 
      network_name:'Rochus Franke',
      email: 'rochus.franke@uni-bonn.de',
      summary: 'Permanent researcher at the Institute of Cellular and Molecular Botany at Bonn University, Bonn, Germany. Expertise in plant biochemistry, bioanalytics and molecular genetics. Research fields include genomics of secondary cell wall biogenesis (cutin, suberin, lignin) and secondary metabolism and the physiology of plant-environment interactions. In the Ecophysiology Department we focus on the plant cuticles as barriers for water and solute transport across leaf surfaces and on the structure of suberized root cell walls forming the soil/root interface.'
    },
    {
      name: 'Isabel Molina',
      image: '/app/assets/aralip_contributors/Isabel-Molina.jpg', 
      profile: 'http://www.linkedin.com/in/isabelmolina',
      network: 'http://www.linkedin.com/in/isabelmolina',
      email: 'isabel.molina@gmail.com',
      summary: 'Plant Biochemist with strong background in lipid biochemistry, molecular biology, genomics, and cellular biology. Has applied multidisciplinary approaches to understand the synthesis of cutin and suberin, the complex lipid polymers that cover the surface of all plants and provide the first defense against a wide range of biotic and abiotic stresses. Her research experience also extends to the field plant proteins, specifically to the study of seed storage protein sorting pathway, and the analysis of their biochemical /biophysical properties.'
    },
    {
      name: 'Vincent Arondel',
      image: '/app/assets/aralip_contributors/Vincent-Arondel.jpg', 
      profile: 'http://www.biomemb.cnrs.fr/',
      email: 'Vincent.arondel@u-bordeaux2.fr',
      summary: 'Researcher interested in plant lipid metabolism and triacylglycerol lipases.'
    },
    {
      name: 'Rémi ZALLOT',
      image: '/app/assets/aralip_contributors/Remi-Zallot.jpg', 
      profile: 'http://www.biomemb.cnrs.fr/',
      network: 'http://www.linkedin.com/pub/r%C3%A9mi-zallot/14/967/386',
      email: 'remi.zallot@gmail.com',
      summary: 'Ph.D. student at Biogenesis Membrane Laboratory working on lipases involved in Arabidopsis thaliana germination.'
    },
    {
      name: 'Ian Graham',
      image: '/app/assets/aralip_contributors/Ian-Graham.jpg', 

      email: 'iag1@york.ac.uk',
      summary: 'Research interests focus on the metabolic regulation of gene expression in higher plants and metabolic engineering of novel oils in oilcrops. Molecular genetic approaches in the model plant Arabidopsis are used to identify key enzymes and regulatory proteins responsible for controlling metabolism and integration of metabolism with plant development. Seed development, dormancy and germination are the major focus of study since they provide an opportunity to study the co-ordinate regulation of entire blocks of genes and biochemical pathways of lipid metabolism. Genes regulating the accumulation and breakdown of seed storage reserves have potentially important biotechnological applications.'
    },
    {
      name: 'Kathy Schmid',
      image: '/app/assets/aralip_contributors/Kathy-Schmid.jpg', 
      profile: 'http://blue.butler.edu/~kschmid/',
      email: 'kschmid@butler.edu',
      summary: 'I am primarily an educator, interested in writing about many aspects of lipid biochemistry and molecular biology. My laboratory concentrates on the biosynthesis and properties of unusual fatty acids, notably those with cyclopropane and cyclopropane rings.'
    },
    {
      name: 'Martine Miquel',
      image: '/app/assets/aralip_contributors/Martine-Miquel.jpg', 

      email: 'Miquel@versailles.inra.fr',
      summary: 'Research scientist at CNRS (the French National Center for Scientific Research), INRA (The French National Institute for Agronomical Research) Versailles center, Versailles, France. My interest is to understand lipid accumulation and especially oil body biogenesis during seed development using genetics and genomics.'
    },
    {
      name: 'Tony Larson',
      image: '/app/assets/aralip_contributors/Tony-Larson.png', 

      email: 'trl1@york.ac.uk',
      summary: 'Research scientist at CNAP (Centre for Novel Agricultural products) at the University of York, York, UK.. Broadly, I am interested in analytical and data-mining techniques obtainable from the mass-spectrometry of plant extracts (e.g. metabolomics). I have specific interests in plant lipid metabolism, especially seed oil accumulation.'
    },
    {
      name: 'Ruth Welti',
      image: '/app/assets/aralip_contributors/Ruth-Welti.jpg',
      network_name:'ScientificCommons',
      email: 'welti@ksu.edu',
      summary: 'Professor, Division of Biology, Kansas State University, USA. Biochemist with experience in lipid analysis, mass spectrometry, and their applications to plant biology.'
    },
    {
      name: 'Allan Debono',
      image: '/app/assets/aralip_contributors/Allan-Debono.jpg', 

      network: 'http://ca.linkedin.com/in/allandebono',
      email: 'allan.debono@gmail.com',
      summary: 'Graduate student at the Department of Botany of the University of British Columbia, Canada. Research examines how lipid transfer proteins are involved in cuticular lipid export from epidermal cells.'
    },
    {
      name: 'Lacey Samuels',
      image: '/app/assets/aralip_contributors/Lacey-Samuels.jpg', 
      profile: 'http://www.botany.ubc.ca/people/lacey-samuels',
      email: 'lsamuels@mail.ubc.ca',
      summary: 'The Samuels lab studies how plant cells secrete their cell walls, both the polysaccharides and specialized cell wall components such as lipids and lignin. Our approach is to integrate cell biology with molecular biology and biochemistry to put cell wall biosynthesis and secretion into a cellular context. All plant growth, including agricultural and forestry production, is based on the organized assembly of plant cells into tissues, organs and whole plants. The plant cell wall determines the shape of the cell and connects cells into tissues and higher order structures, thus plant growth depends on cell wall production. In addition, terrestrial plants have evolved specialized regions of cell walls, such as the plant cuticle and lignified cell walls that are essential for water retention and water conduction, respectively. Lignified cell walls, such as those found in vascular tissues like wood, make the wall strong and waterproof. The removal of lignin from the cellulose of the cell wall has been identified as a barrier to enzymatic degradation of cellulose feedstock for biofuels, so there is strong interest in understanding lignified secondary cell walls.'
    },
    {
      name: 'John Ohlrogge',
      image: '/app/assets/aralip_contributors/John-Ohlrogge.jpg', 
      profile: 'https://directory.natsci.msu.edu/directory/Profiles/Person/102418',
      network: 'http://ohlroggelab.plantbiology.msu.edu/',
      network_name:"Ohlrogge's Lab",
      email: 'ohlrogge@msu.edu',
      summary: 'Biochemist with experience in fatty acid synthesis, seed lipid metabolism, genomic strategies, and metabolic engineering.'
    },
    {
      name: 'Basil Shorrosh',
      image: '/app/assets/aralip_contributors/Basil-Shorrosh.jpg', 
      profile: 'http://bshorrosh.blogspot.com/',
      network: 'http://www.linkedin.com/in/bshorrosh', 
      network_per:'http://www.biomedexperts.com/Profile.bme/1848021',
      network_per_name:'BiomedExpert',
      email: 'bshorrosh@gmail.com',
      summary: 'Biotechnology scientist experienced in plant genetic/metabolic engineering, molecular accelerated breeding, lipid biosynthesis, and software development.'
    }
  ];
}