/**
 * Bibliography for the methods used on this site, in APA 7 form.
 *
 * Every analytic procedure the dashboard reports names its source here, so a
 * write-up can cite the test rather than the tool. Keys are stable and are
 * used by the <Cite> component and by the exported methods note.
 */

export type Reference = {
  key: string;
  /** Author-date form used in running text, e.g. "Cronbach, 1951". */
  inText: string;
  /** Full APA 7 reference-list entry, without the trailing DOI/URL. */
  full: string;
  doi?: string;
  url?: string;
  /** Which part of the site relies on this work. */
  usedFor: string;
};

export const references: Reference[] = [
  {
    key: "apa2020",
    inText: "American Psychological Association, 2020",
    full: "American Psychological Association. (2020). Publication manual of the American Psychological Association (7th ed.).",
    doi: "10.1037/0000165-000",
    usedFor:
      "Reporting format for statistics, tables, and reference entries throughout the dashboard.",
  },
  {
    key: "benjamini1995",
    inText: "Benjamini & Hochberg, 1995",
    full: "Benjamini, Y., & Hochberg, Y. (1995). Controlling the false discovery rate: A practical and powerful approach to multiple testing. Journal of the Royal Statistical Society: Series B, 57(1), 289-300.",
    doi: "10.1111/j.2517-6161.1995.tb02031.x",
    usedFor:
      "False-discovery-rate adjusted p-values across the ten items, offered alongside the Holm correction.",
  },
  {
    key: "cohen1960",
    inText: "Cohen, 1960",
    full: "Cohen, J. (1960). A coefficient of agreement for nominal scales. Educational and Psychological Measurement, 20(1), 37-46.",
    doi: "10.1177/001316446002000104",
    usedFor:
      "Cohen's kappa for inter-coder agreement in the qualitative coding tab.",
  },
  {
    key: "cohen1988",
    inText: "Cohen, 1988",
    full: "Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.",
    usedFor:
      "Cohen's d_z effect size and the negligible/small/medium/large descriptive bands.",
  },
  {
    key: "cronbach1951",
    inText: "Cronbach, 1951",
    full: "Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. Psychometrika, 16(3), 297-334.",
    doi: "10.1007/BF02310555",
    usedFor:
      "Internal-consistency reliability for each domain scale and for the full ten-item instrument.",
  },
  {
    key: "elo2008",
    inText: "Elo & Kyngäs, 2008",
    full: "Elo, S., & Kyngäs, H. (2008). The qualitative content analysis process. Journal of Advanced Nursing, 62(1), 107-115.",
    doi: "10.1111/j.1365-2648.2007.04569.x",
    usedFor:
      "Deductive content analysis: applying the instrument's predefined coding categories to the open responses.",
  },
  {
    key: "holm1979",
    inText: "Holm, 1979",
    full: "Holm, S. (1979). A simple sequentially rejective multiple test procedure. Scandinavian Journal of Statistics, 6(2), 65-70.",
    url: "https://www.jstor.org/stable/4615733",
    usedFor:
      "Family-wise error correction across the ten item-level tests, reported as the default adjustment.",
  },
  {
    key: "hutto2014",
    inText: "Hutto & Gilbert, 2014",
    full: "Hutto, C. J., & Gilbert, E. (2014). VADER: A parsimonious rule-based model for sentiment analysis of social media text. Proceedings of the International AAAI Conference on Web and Social Media, 8(1), 216-225.",
    doi: "10.1609/icwsm.v8i1.14550",
    usedFor:
      "The valence-aware lexicon and rules producing the compound sentiment score for each open response.",
  },
  {
    key: "kerby2014",
    inText: "Kerby, 2014",
    full: "Kerby, D. S. (2014). The simple difference formula: An approach to teaching nonparametric correlation. Comprehensive Psychology, 3, 11.IT.3.1.",
    doi: "10.2466/11.IT.3.1",
    usedFor:
      "Matched-pairs rank-biserial correlation, the effect size reported with the Wilcoxon test.",
  },
  {
    key: "krippendorff2018",
    inText: "Krippendorff, 2018",
    full: "Krippendorff, K. (2018). Content analysis: An introduction to its methodology (4th ed.). SAGE Publications.",
    usedFor:
      "Codebook construction, unitizing, and the reliability standards applied to the qualitative tab.",
  },
  {
    key: "kruger1999",
    inText: "Kruger & Dunning, 1999",
    full: "Kruger, J., & Dunning, D. (1999). Unskilled and unaware of it: How difficulties in recognizing one's own incompetence lead to inflated self-assessments. Journal of Personality and Social Psychology, 77(6), 1121-1134.",
    doi: "10.1037/0022-3514.77.6.1121",
    usedFor:
      "Interpretive caution when self-rated confidence moves independently of demonstrated competence.",
  },
  {
    key: "lakens2013",
    inText: "Lakens, 2013",
    full: "Lakens, D. (2013). Calculating and reporting effect sizes to facilitate cumulative science: A practical primer for t-tests and ANOVAs. Frontiers in Psychology, 4, 863.",
    doi: "10.3389/fpsyg.2013.00863",
    usedFor:
      "Choice of d_z for a within-subjects design, and reporting effect sizes with confidence intervals.",
  },
  {
    key: "landis1977",
    inText: "Landis & Koch, 1977",
    full: "Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data. Biometrics, 33(1), 159-174.",
    doi: "10.2307/2529310",
    usedFor: "The descriptive bands attached to reported kappa values.",
  },
  {
    key: "likert1932",
    inText: "Likert, 1932",
    full: "Likert, R. (1932). A technique for the measurement of attitudes. Archives of Psychology, 140, 1-55.",
    usedFor: "The rating-scale format of the seven-point confidence items.",
  },
  {
    key: "mcnemar1947",
    inText: "McNemar, 1947",
    full: "McNemar, Q. (1947). Note on the sampling error of the difference between correlated proportions or percentages. Psychometrika, 12(2), 153-157.",
    doi: "10.1007/BF02295996",
    usedFor:
      "Testing whether the presence of a qualitative code changed between the pre and post responses of the same students.",
  },
  {
    key: "norman2010",
    inText: "Norman, 2010",
    full: "Norman, G. (2010). Likert scales, levels of measurement and the 'laws' of statistics. Advances in Health Sciences Education, 15(5), 625-632.",
    doi: "10.1007/s10459-010-9222-y",
    usedFor:
      "Justification for reporting a parametric test alongside the nonparametric test on ordinal rating data.",
  },
  {
    key: "sitzmann2010",
    inText: "Sitzmann et al., 2010",
    full: "Sitzmann, T., Ely, K., Brown, K. G., & Bauer, K. N. (2010). Self-assessment of knowledge: A cognitive learning or affective measure? Academy of Management Learning & Education, 9(2), 169-191.",
    doi: "10.5465/amle.9.2.zqr169",
    usedFor:
      "The central limitation: self-reported confidence is more closely related to affect and motivation than to demonstrated learning.",
  },
  {
    key: "wilcoxon1945",
    inText: "Wilcoxon, 1945",
    full: "Wilcoxon, F. (1945). Individual comparisons by ranking methods. Biometrics Bulletin, 1(6), 80-83.",
    doi: "10.2307/3001968",
    usedFor:
      "The nonparametric paired test used as the primary inferential test for the ordinal items.",
  },
];

export const referenceMap: Record<string, Reference> = Object.fromEntries(
  references.map((r) => [r.key, r]),
);

/** Course and challenge materials cited as primary sources. */
export const primarySources: Reference[] = [
  {
    key: "hr6644",
    inText: "H.R. 6644, 119th Cong., 2026",
    full: "Section 208, H.R. 6644, 119th Congress (2026).",
    url: "https://www.congress.gov/bill/119th-congress/house-bill/6644/text#H942E032183DE4D569D14C3EA9A789A81",
    usedFor:
      "Federal policy context supplied with the challenge. Cited as authorization only, not as an appropriation or award.",
  },
  {
    key: "mwslop",
    inText: "Merriam-Webster, n.d.",
    full: "Merriam-Webster. (n.d.). AI slop. In Merriam-Webster.com dictionary.",
    url: "https://www.merriam-webster.com/dictionary/ai%20slop",
    usedFor: "The definition of AI slop used in the academic-quality section.",
  },
  {
    key: "shaib2025",
    inText: "Shaib et al., 2025",
    full: "Shaib, C., et al. (2025). Measuring AI slop in text. arXiv.",
    url: "https://arxiv.org/abs/2509.19163",
    usedFor:
      "The observation that no single technical definition of AI slop is settled, so the rubric evaluates observable quality instead.",
  },
];

export function doiUrl(ref: Reference): string | undefined {
  if (ref.doi) return `https://doi.org/${ref.doi}`;
  return ref.url;
}
