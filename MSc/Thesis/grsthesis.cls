\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{grsthesis}[2011/03/15 Thesis Class for the German Research School for Simulation Sciences]
% The thesis class is based on KoMa-Skript
\LoadClass{scrbook}
% Using TikZ for drawing
\RequirePackage{tikz}
% Using xspace for proper spacing after redefined commands
\RequirePackage{xspace}
% Use Helvetica as sans serif font
% Corporate S would be great (maybe as an option?)
%\RequirePackage{helvet}

% normal commands (may not need redefinition)
\newcommand{\theauthor}{Qian Zhang}
\newcommand{\theshortauthor}{}
\renewcommand{\author}[2][]{
    \renewcommand{\theauthor}{#2}%
    \renewcommand{\theshortauthor}{#1}%
}
\newcommand{\thetitle}{Calculations of atomic multiplets across the periodic table}
\newcommand{\theshorttitle}{}
\renewcommand{\title}[2][]{%
    \renewcommand{\thetitle}{#2}%
    \renewcommand{\theshorttitle}{#1}%
}
\newcommand{\theinstitute}{German Research School for Simulation Sciences}
\newcommand{\institute}[1]{\renewcommand{\theinstitute}{#1}}

\newcommand{\thedate}{September 2014}
\newcommand{\theyear}{2014}
\newcommand{\theplace}{Aachen}

% setting defaults for people involved
\newcommand{\thesupervisor}{Prof. Dr. Erik Koch}
\newcommand{\thesupervisorinst}{}
\newcommand{\theexaminer}{Prof. Dr. Erik Koch}
\newcommand{\theexaminerinst}{}
\newcommand{\thecoexaminer}{Prof. Dr. Eva Pavarini}
\newcommand{\thecoexaminerinst}{}

% people involved
\newcommand{\supervisor}[1]{\renewcommand{\thesupervisor}{#1\xspace}}
\newcommand{\supervisorinst}[1]{\renewcommand{\thesupervisorinst}{#1\xspace}}
\newcommand{\examiner}[1]{\renewcommand{\theexaminer}{#1\xspace}}
\newcommand{\examinerinst}[1]{\renewcommand{\theexaminerinst}{#1\xspace}}
\newcommand{\coexaminer}[1]{\renewcommand{\thecoexaminer}{#1\xspace}}
\newcommand{\coexaminerinst}[1]{\renewcommand{\thecoexaminer}{#1\xspace}}

% different logo layouts
\DeclareOption{grs}{%
    \newcommand{\grsthesis@logofile}{img/grs_logo}%
    \newlength{\grsthesis@logowidth}%
    \setlength{\grsthesis@logowidth}{8cm}%
    \newlength{\grsthesis@logoindent}%
    \setlength{\grsthesis@logoindent}{2.7cm}%
}
\DeclareOption{aices}{}
\DeclareOption{cces}{}
\DeclareOption{external}{}

\newcommand{\grsthesis@supervisor}{}
\newcommand{\grsthesis@examiner}{}
\newcommand{\grsthesis@coexaminer}{}
\newcommand{\grsthesis@phdthesis}{}
\newcommand{\grsthesis@masterthesis}{}
\newcommand{\grsthesis@bachelorthesis}{}
\newcommand{\grsthesis@seminarthesis}{}
\newcommand{\grsthesis@diplomathesis}{}
\newcommand{\grsthesis@type}{}

% language options
\DeclareOption{german}{%
    \renewcommand{\grsthesis@supervisor}{Betreuer}
    \renewcommand{\grsthesis@examiner}{Referent}
    \renewcommand{\grsthesis@coexaminer}{Korreferent}
    \renewcommand{\grsthesis@phdthesis}{Dissertation}
    \renewcommand{\grsthesis@masterthesis}{Masterarbeit}
    \renewcommand{\grsthesis@bachelorthesis}{Bachelorarbeit}
    \renewcommand{\grsthesis@seminarthesis}{Seminararbeit}
    \renewcommand{\grsthesis@diplomathesis}{Diplomarbeit}
}
\DeclareOption{english}{%
    \renewcommand{\grsthesis@supervisor}{Supervisor}
    \renewcommand{\grsthesis@examiner}{Examiner}
    \renewcommand{\grsthesis@coexaminer}{Co-Examiner}
    \renewcommand{\grsthesis@phdthesis}{Dissertation Thesis}
    \renewcommand{\grsthesis@masterthesis}{Master's Thesis}
    \renewcommand{\grsthesis@bachelorthesis}{Bachelor's Thesis}
    \renewcommand{\grsthesis@seminarthesis}{Seminar Thesis}
    \renewcommand{\grsthesis@diplomathesis}{Diploma Thesis}
}


% type of thesis
\DeclareOption{phd}{%
  \renewcommand{\grsthesis@type}{\grsthesis@phdthesis}%
}  
\DeclareOption{master}{%
  \renewcommand{\grsthesis@type}{\grsthesis@masterthesis}%
}  
\DeclareOption{bachelor}{%
  \renewcommand{\grsthesis@type}{\grsthesis@bachelorthesis}%
}  
\DeclareOption{seminar}{%
  \renewcommand{\grsthesis@type}{\grsthesis@seminarthesis}%
}  
\DeclareOption{diplom}{%
  \renewcommand{\grsthesis@type}{\grsthesis@diplomathesis}%
}  

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{scrbook}}

\ExecuteOptions{english,master,grs}
\ProcessOptions\relax

\newlength{\titleblockskip}
\setlength{\titleblockskip}{8mm}

\newlength{\titlelineskip}
\setlength{\titlelineskip}{2mm}

\newlength{\titletypeskip}
\setlength{\titletypeskip}{1.5cm}

\pgfdeclareimage[width=8cm]{mainlogo}{\grsthesis@logofile}%
\pgfdeclareimage[height=1.5cm]{fzjrwthlogo}{img/fzj_rwth_logo}

\pgfkeys{%
    /grsthesis/logo/.style={%
        /tikz/inner sep=0pt,%
    },%
    /grsthesis/title/.style={%
        /tikz/inner sep=0pt,%
        /tikz/text width=14cm,%
        /tikz/text badly ragged,%
        /tikz/font=\LARGE\bfseries,%
        /tikz/anchor=west,%
        /tikz/text=black,%
    },%
    /grsthesis/descr/.style={%
        /tikz/font=\bfseries,%
        /tikz/inner sep=0pt,%
    },%
    /grsthesis/name/.style={%
        /tikz/inner sep=0pt,%
    },%
    /grsthesis/ragged right/.style={%
        /tikz/anchor=west,%
    },%
    /grsthesis/ragged left/.style={%
        /tikz/anchor=east,%
    },%
}

\renewcommand{\maketitle}{%
\begin{titlepage}
\vspace*{-2.5cm}
\hspace*{-0.5cm}
\begin{tikzpicture}[overlay]

\draw node [/grsthesis/logo,anchor=north west] (mainlogo) {\pgfuseimage{mainlogo}};

\draw (mainlogo.south west)++(2.7cm,-5.5cm) node [/grsthesis/title] (title) {\thetitle};

\draw (title.south west)++(0,-\titletypeskip) node [/grsthesis/descr, anchor=north west] (type) {\Large\grsthesis@type};
\draw (type.south west)++(0,-2\titlelineskip) node [/grsthesis/name, anchor=north west] (author) {\theauthor};

\draw (mainlogo.south west)++(17.5cm,-24cm) node [/grsthesis/logo,anchor=south east] (fzjrwth) {\pgfuseimage{fzjrwthlogo}};

\draw (fzjrwth.north east)++(0,1cm) node [/grsthesis/name,anchor=south east] (coexaminer) {\thecoexaminer};
\draw (coexaminer.north east)++(0,\titlelineskip) node [/grsthesis/descr,anchor=south east] (coexaminerdescr) {\grsthesis@coexaminer};

\draw (coexaminerdescr.north east)++(0,\titleblockskip) node [/grsthesis/name,anchor=south east] (examiner) {\theexaminer};
\draw (examiner.north east)++(0,\titlelineskip) node [/grsthesis/descr,anchor=south east] (examinerdescr) {\grsthesis@examiner};

\draw (examinerdescr.north east)++(0,\titleblockskip) node [/grsthesis/name,anchor=south east] (supervisor) {\thesupervisor};
\draw (supervisor.north east)++(0,\titlelineskip) node [/grsthesis/descr,anchor=south east] (supervisordescr) {\grsthesis@supervisor};

\draw (supervisordescr.north east)++(0,2\titleblockskip) node [/grsthesis/name,anchor=south east] (date) {\thedate};
\end{tikzpicture}
\end{titlepage}
}
